/**
 * 🏰 useKingdom - CORE CENTRAL DO SISTEMA
 *
 * RESPONSABILIDADES:
 * - Gerenciar Reino (multiusuário)
 * - Sincronizar dados com Firestore
 * - Centralizar transações e investimentos
 * - Integrar gamificação (XP)
 *
 * REGRAS:
 * ❗ Não duplicar cálculos financeiros
 * ❗ Sempre usar category_id
 * ❗ Não misturar lógica de UI aqui
 */

import { useState, useEffect } from 'react';
import { db, auth } from '@/services/firebase';
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  writeBatch,
  orderBy
} from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

import {
  Kingdom,
  KingdomRole,
  Asset,
  Transaction,
  ActivityLog,
  ContributionPlanning
} from '@/types';

import { kingdomService } from '@/services/kingdomService';
import { getCollectionByKingdom, parseDate, handleFirestoreError, OperationType } from '@/services/firebaseUtils';

import { addXP, calculateXPFromInvestments } from '@/lib/gameEngine';
import { logActivity } from '@/lib/auditLogger';
import { hasPermission } from '@/lib/permissionEngine';

export function useKingdom() {
  const [kingdom, setKingdom] = useState<Kingdom | null>(null);
  const [role, setRole] = useState<KingdomRole | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [contributionPlanning, setContributionPlanning] = useState<ContributionPlanning | null>(null);

  /**
   * 🔐 AUTH + REINO
   */
  useEffect(() => {
    let unsubscribes: (() => void)[] = [];

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        resetState();
        return;
      }

      try {
        const kingdoms = await kingdomService.getUserKingdoms(user.uid);

        let currentKingdom = kingdoms[0];

        if (!currentKingdom) {
          currentKingdom = await kingdomService.createKingdom(
            `Reino de ${user.displayName || 'Herói'}`,
            user.uid
          );
        }

        setKingdom(currentKingdom);

        const memberQuery = query(
          collection(db, 'kingdom_members'),
          where('kingdom_id', '==', currentKingdom.id),
          where('user_id', '==', user.uid)
        );

        const unsubscribeMember = onSnapshot(memberQuery, (snap) => {
          if (!snap.empty) {
            setRole(snap.docs[0].data().role);
            setMemberId(snap.docs[0].id);
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, 'kingdom_members');
        });

        unsubscribes.push(unsubscribeMember);

        const setupListeners = (kId: string, unsubs: (() => void)[]) => {
          // Assets
          const unsubAssets = onSnapshot(
            getCollectionByKingdom('investments', kId),
            (snap) => {
              setAssets(
                snap.docs.map((d) => ({
                  id: d.id,
                  ...d.data()
                })) as Asset[]
              );
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, 'investments');
            }
          );

          // Transactions
          const unsubTransactions = onSnapshot(
            query(
              getCollectionByKingdom('transactions', kId),
              orderBy('created_at', 'desc')
            ),
            (snap) => {
              setTransactions(
                snap.docs.map((d) => ({
                  id: d.id,
                  ...d.data(),
                  date: parseDate(d.data().date),
                  created_at: parseDate(d.data().created_at)
                })) as Transaction[]
              );
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, 'transactions');
            }
          );

          // Logs
          const unsubLogs = onSnapshot(
            query(
              getCollectionByKingdom('activity_logs', kId),
              orderBy('created_at', 'desc')
            ),
            (snap) => {
              setActivityLogs(
                snap.docs.map((d) => ({
                  id: d.id,
                  ...d.data(),
                  created_at: parseDate(d.data().created_at)
                })) as ActivityLog[]
              );
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, 'activity_logs');
            }
          );

          // Contribution Planning
          const unsubPlanning = onSnapshot(
            query(
              getCollectionByKingdom('contribution_planning', kId)
            ),
            (snap) => {
              if (!snap.empty) {
                setContributionPlanning(snap.docs[0].data() as ContributionPlanning);
              } else {
                setContributionPlanning(null);
              }
            },
            (error) => {
              handleFirestoreError(error, OperationType.GET, 'contribution_planning');
            }
          );

          unsubs.push(unsubAssets, unsubTransactions, unsubLogs, unsubPlanning);
        };

        setupListeners(currentKingdom.id, unsubscribes);

      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribes.forEach((u) => u && u());
    };
  }, []);

  /**
   * ⚙️ ACTIONS
   */

  const addTransaction = async (data: Partial<Transaction>) => {
    validateBase();

    if (!data.category_id) {
      throw new Error('Categoria obrigatória');
    }

    const id = doc(collection(db, 'transactions')).id;

    const payload = {
      id,
      user_id: auth.currentUser!.uid,
      userName: auth.currentUser!.displayName || 'Usuário',
      amount: data.amount,
      type: data.type,
      description: data.description,
      category_id: data.category_id,
      date: new Date(data.date!),
      created_at: new Date(),
      kingdom_id: kingdom!.id,
      created_by: auth.currentUser!.uid,
      status: 'concluído'
    };

    await setDoc(doc(db, 'transactions', id), payload);

    await logActivity(kingdom!.id, auth.currentUser!.uid, 'CREATE_TRANSACTION', id);
    await addXP(auth.currentUser!.uid, 10);
  };

  const updateTransaction = async (id: string, data: Partial<Transaction>) => {
    validateBase();
    
    const txRef = doc(db, 'transactions', id);
    const txDoc = await getDoc(txRef);
    
    if (!txDoc.exists()) {
      throw new Error('Transaction not found');
    }
    
    const updateData: any = { ...data };
    if (data.date) {
      updateData.date = new Date(data.date);
    }
    
    await updateDoc(txRef, updateData);
    await logActivity(kingdom!.id, auth.currentUser!.uid, 'UPDATE_TRANSACTION', id);
  };

  const addInvestment = async (data: {
    ticker: string;
    value: number;
    quantity: number;
    type: string;
    date: string;
  }) => {
    validateBase();

    const batch = writeBatch(db);

    const invId = doc(collection(db, 'investments')).id;
    const txId = doc(collection(db, 'transactions')).id;

    batch.set(doc(db, 'investments', invId), {
      id: invId,
      ticker: data.ticker,
      quantity: data.quantity,
      invested_value: data.value,
      type: data.type,
      created_at: new Date(),
      kingdom_id: kingdom!.id,
      created_by: auth.currentUser!.uid,
      transaction_id: txId
    });

    batch.set(doc(db, 'transactions', txId), {
      id: txId,
      type: 'investment',
      amount: data.value,
      category_id: 'investment',
      description: `Aporte em ${data.ticker}`,
      date: new Date(data.date),
      created_at: new Date(),
      user_id: auth.currentUser!.uid,
      kingdom_id: kingdom!.id
    });

    await batch.commit();

    const xp = calculateXPFromInvestments(data.value);
    await addXP(auth.currentUser!.uid, xp);
  };

  const addEarning = async (data: {
    ticker: string;
    amount: number;
    type: 'dividend' | 'jcp' | 'rent' | 'other';
    date: string;
  }) => {
    validateBase();
    const id = doc(collection(db, 'transactions')).id;
    await setDoc(doc(db, 'transactions', id), {
      id,
      type: 'earning',
      amount: data.amount,
      category_id: 'earning',
      description: `Provento de ${data.ticker} (${data.type})`,
      date: new Date(data.date),
      created_at: new Date(),
      user_id: auth.currentUser!.uid,
      kingdom_id: kingdom!.id
    });
    await logActivity(kingdom!.id, auth.currentUser!.uid, 'CREATE_EARNING', id);
  };

  const deleteTransaction = async (id: string) => {
    validateBase();
    await deleteDoc(doc(db, 'transactions', id));
  };

  const deleteInvestment = async (ids: string | string[]) => {
    validateBase();
    const idsArray = Array.isArray(ids) ? ids : [ids];
    console.log('Attempting to delete investments:', idsArray);
    
    const batch = writeBatch(db);
    
    for (const id of idsArray) {
      const invDoc = await getDoc(doc(db, 'investments', id));
      if (!invDoc.exists()) {
          console.warn('Investment not found:', id);
          continue;
      }
      const invData = invDoc.data();
      console.log('Investment data:', invData);
      
      batch.delete(doc(db, 'investments', id));
      
      if (invData.transaction_id) {
          console.log('Deleting associated transaction:', invData.transaction_id);
          batch.delete(doc(db, 'transactions', invData.transaction_id));
      }
    }
    
    await batch.commit();
    console.log('Investments deleted successfully');
    await logActivity(kingdom!.id, auth.currentUser!.uid, 'DELETE_INVESTMENT', idsArray.join(', '));
  };

  const joinKingdomByCode = async (code: string) => {
    if (!auth.currentUser) throw new Error('Not authenticated');
    const kingdom = await kingdomService.getKingdomByInviteCode(code);
    if (!kingdom) throw new Error('Invalid code');
    await kingdomService.addMember(kingdom.id, auth.currentUser.uid, 'member');
  };

  const updateContributionPlanning = async (percentages: {
    F: number;
    A: number;
    C: number;
    E: number;
    R: number;
    O: number;
  }) => {
    validateBase();
    
    let planningRef;
    if (contributionPlanning) {
      planningRef = doc(db, 'contribution_planning', contributionPlanning.id);
    } else {
      planningRef = doc(collection(db, 'contribution_planning'));
    }

    const payload = {
      id: planningRef.id,
      kingdom_id: kingdom!.id,
      percentages
    };
    await setDoc(planningRef, payload);
    await logActivity(kingdom!.id, auth.currentUser!.uid, 'UPDATE_CONTRIBUTION_PLANNING', planningRef.id);
  };

  /**
   * 🧩 HELPERS
   */

  const parseDate = (date: any): string => {
    if (!date) return new Date().toISOString();
    if (date.seconds) return new Date(date.seconds * 1000).toISOString();
    return new Date(date).toISOString();
  };

  const validateBase = () => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    if (!kingdom) throw new Error('Reino não encontrado');
    if (!role) throw new Error('Permissão não definida');
  };

  const resetState = () => {
    setKingdom(null);
    setRole(null);
    setAssets([]);
    setTransactions([]);
    setActivityLogs([]);
    setLoading(false);
  };

  return {
    kingdom,
    role,
    memberId,
    loading,
    assets,
    transactions,
    activityLogs,
    addTransaction,
    addInvestment,
    addEarning,
    deleteTransaction,
    deleteInvestment,
    joinKingdomByCode,
    contributionPlanning,
    updateContributionPlanning
  };
}

// 👥 LISTAR MEMBROS DO REINO
export function useKingdomMembers(kingdomId?: string) {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kingdomId) {
      const timer = setTimeout(() => {
        setMembers([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const q = query(
      collection(db, 'kingdom_members'),
      where('kingdom_id', '==', kingdomId)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMembers(data);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'kingdom_members');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [kingdomId]);

  return { members, loading };
}

export function useUserInvites(email?: string) {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setTimeout(() => {
        setInvites([]);
        setLoading(false);
      }, 0);
      return;
    }

    const unsub = onSnapshot(
      query(
        collection(db, 'kingdom_invites'),
        where('email', '==', email),
        where('status', '==', 'pending')
      ),
      (snap) => {
        setInvites(
          snap.docs.map(d => ({
            id: d.id,
            ...d.data()
          }))
        );
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'user_invites');
        setLoading(false);
      }
    );

    return () => unsub();
  }, [email]);

  return { invites, loading };
}

export function useKingdomInvites(kingdomId?: string) {
  const [invites, setInvites] = useState<any[]>([]);

  useEffect(() => {
    if (!kingdomId) return;

    const unsub = onSnapshot(
      query(
        collection(db, 'kingdom_invites'),
        where('kingdom_id', '==', kingdomId)
      ),
      (snap) => {
        setInvites(
          snap.docs.map(d => ({
            id: d.id,
            ...d.data()
          }))
        );
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'kingdom_invites');
      }
    );

    return () => unsub();
  }, [kingdomId]);

  return { invites };
}