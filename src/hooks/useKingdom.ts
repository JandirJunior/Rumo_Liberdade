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
  ActivityLog
} from '@/types';

import { kingdomService } from '@/services/kingdomService';
import { getCollectionByKingdom } from '@/services/firebaseUtils';
import { handleFirestoreError, OperationType } from '@/services/firebaseUtils';

import { addXP, calculateXPFromInvestments } from '@/lib/gameEngine';
import { logActivity } from '@/lib/auditLogger';
import { hasPermission } from '@/lib/permissionEngine';

export function useKingdom() {
  const [kingdom, setKingdom] = useState<Kingdom | null>(null);
  const [role, setRole] = useState<KingdomRole | null>(null);
  const [loading, setLoading] = useState(true);

  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);

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
          }
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
                  ...d.data()
                })) as ActivityLog[]
              );
            }
          );

          unsubs.push(unsubAssets, unsubTransactions, unsubLogs);
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
      created_by: auth.currentUser!.uid
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

  const deleteTransaction = async (id: string) => {
    validateBase();
    await deleteDoc(doc(db, 'transactions', id));
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
    loading,
    assets,
    transactions,
    activityLogs,
    addTransaction,
    addInvestment,
    deleteTransaction
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
    });

    return () => unsubscribe();
  }, [kingdomId]);

  return { members, loading };
}

/**
 * 📩 useKingdomInvites
 * Gerencia convites do reino
 */

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
      }
    );

    return () => unsub();
  }, [kingdomId]);

  return { invites };
}