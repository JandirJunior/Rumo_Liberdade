import { useState, useEffect, useCallback } from 'react';
import { db, auth } from '@/services/firebase';
import { collection, onSnapshot, query, where, doc, getDoc, orderBy, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Kingdom, KingdomMember, KingdomInvite, KingdomRole, Asset, Transaction, ActivityLog } from '@/types';
import { kingdomService } from '@/services/kingdomService';
import { handleFirestoreError, OperationType, getCollectionByKingdom } from '@/services/firebaseUtils';
import { addXP, calculateXPFromInvestments } from '@/lib/gameEngine';
import { canCreateTransaction, canEditTransaction, canDeleteTransaction, hasPermission } from '@/lib/permissionEngine';
import { logActivity } from '@/lib/auditLogger';
import { useCategories } from './useCategories';

export function useKingdom() {
  const [kingdom, setKingdom] = useState<Kingdom | null>(null);
  const [role, setRole] = useState<KingdomRole | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Data
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  
  const { categories } = useCategories();

  useEffect(() => {
    let unsubscribeMembers: () => void;
    let unsubscribeAssets: () => void;
    let unsubscribeTransactions: () => void;
    let unsubscribeLogs: () => void;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setKingdom(null);
        setRole(null);
        setMemberId(null);
        setAssets([]);
        setTransactions([]);
        setActivityLogs([]);
        setLoading(false);
        setDataLoading(false);
        return;
      }

      try {
        const kingdoms = await kingdomService.getUserKingdoms(user.uid);
        
        if (kingdoms.length > 0) {
          const currentKingdom = kingdoms[0];
          setKingdom(currentKingdom);
          
          const membersRef = collection(db, 'kingdom_members');
          const q = query(membersRef, where('kingdom_id', '==', currentKingdom.id), where('user_id', '==', user.uid));
          
          unsubscribeMembers = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
              const currentRole = snapshot.docs[0].data().role as KingdomRole;
              setRole(currentRole);
              setMemberId(snapshot.docs[0].id);
              
              // Now that we have kingdom and role, fetch data
              setupDataListeners(currentKingdom.id, currentRole);
            }
            setLoading(false);
          }, (error) => {
            handleFirestoreError(error, OperationType.GET, 'kingdom_members');
          });
        } else {
          const newKingdom = await kingdomService.createKingdom(`Reino de ${user.displayName || 'Herói'}`, user.uid);
          setKingdom(newKingdom);
          setRole('admin');
          setLoading(false);
          setupDataListeners(newKingdom.id, 'admin');
        }
      } catch (error) {
        console.error("Error loading kingdom:", error);
        setLoading(false);
      }
    });

    const setupDataListeners = (kingdomId: string, currentRole: KingdomRole) => {
      setDataLoading(true);
      
      // Assets listener
      const assetsQuery = query(getCollectionByKingdom('investments', kingdomId));
      unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const loadedAssets = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.user_id,
              name: data.ticker || 'Investimento',
              value: Number(data.current_value || data.value || 0),
              faceroType: data.type === 'fii' ? 'F' : data.type === 'stock' ? 'A' : data.type === 'crypto' ? 'C' : data.type === 'etf' ? 'E' : data.type === 'fixed_income' ? 'R' : 'O',
              type: data.type,
              yield: Number(data.earnings || 0),
              quantity: Number(data.quantity || 0),
              operation_date: data.operation_date || data.created_at || '',
              color: 'bg-emerald-500',
              kingdom_id: data.kingdom_id,
              created_by: data.created_by,
              segment: data.type || 'Outros',
              targetPercent: 0,
              organizationId: 'default'
            } as unknown as Asset;
          });
          setAssets(loadedAssets);
        } else {
          setAssets([]);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'investments');
      });

      // Transactions listener
      let transactionsQuery;
      if (currentRole === 'admin') {
        transactionsQuery = query(getCollectionByKingdom('transactions', kingdomId), orderBy('created_at', 'desc'));
      } else {
        transactionsQuery = query(
          getCollectionByKingdom('transactions', kingdomId),
          where('user_id', '==', auth.currentUser?.uid),
          orderBy('created_at', 'desc')
        );
      }

      unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const loadedTransactions = snapshot.docs.map(doc => {
            const data = doc.data();
            
            let dateStr = new Date().toISOString();
            if (data.date) {
              if (data.date.seconds) {
                dateStr = new Date(data.date.seconds * 1000).toISOString();
              } else if (typeof data.date === 'string') {
                dateStr = new Date(data.date).toISOString();
              }
            }

            let createdAtStr = new Date().toISOString();
            if (data.created_at) {
              if (data.created_at.seconds) {
                createdAtStr = new Date(data.created_at.seconds * 1000).toISOString();
              } else if (typeof data.created_at === 'string') {
                createdAtStr = new Date(data.created_at).toISOString();
              }
            }
            
            return {
              id: doc.id,
              userId: data.user_id,
              userName: data.userName,
              amount: data.amount,
              type: data.type,
              title: data.description || 'Transação',
              description: data.description || 'Transação',
              category_id: data.category_id,
              date: dateStr,
              createdAt: createdAtStr,
              created_at: createdAtStr,
              kingdom_id: data.kingdom_id,
              created_by: data.created_by
            } as Transaction;
          });
          setTransactions(loadedTransactions);
        } else {
          setTransactions([]);
        }
        setDataLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'transactions');
      });

      // Logs listener
      const logsQuery = query(getCollectionByKingdom('activity_logs', kingdomId), orderBy('created_at', 'desc'));
      unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const loadedLogs = snapshot.docs.map(doc => {
            const data = doc.data();
            return {
              id: doc.id,
              ...data,
              created_at: data.created_at ? new Date(data.created_at.seconds * 1000).toISOString() : new Date().toISOString()
            } as ActivityLog;
          });
          setActivityLogs(loadedLogs);
        } else {
          setActivityLogs([]);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'activity_logs');
      });
    };

    return () => {
      unsubscribeAuth();
      if (unsubscribeMembers) unsubscribeMembers();
      if (unsubscribeAssets) unsubscribeAssets();
      if (unsubscribeTransactions) unsubscribeTransactions();
      if (unsubscribeLogs) unsubscribeLogs();
    };
  }, []);

  const joinKingdomByCode = async (code: string) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado');
    const kingdomToJoin = await kingdomService.getKingdomByInviteCode(code);
    if (!kingdomToJoin) throw new Error('Reino não encontrado');
    
    const members = await kingdomService.getKingdomMembers(kingdomToJoin.id);
    if (members.some(m => m.user_id === auth.currentUser!.uid)) {
      throw new Error('Você já é membro deste Reino');
    }

    await kingdomService.addMember(kingdomToJoin.id, auth.currentUser.uid, 'viewer');
    setKingdom(kingdomToJoin);
    setRole('viewer');
    return kingdomToJoin;
  };

  // Functions
  const addTransaction = async (transaction: Partial<Transaction>) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    if (!kingdom) throw new Error('Reino não encontrado.');
    if (!role) throw new Error('Papel de usuário não definido.');
    if (!canCreateTransaction(role)) throw new Error('Sem permissão para criar transações');
    
    if (!transaction.type) throw new Error('O tipo é obrigatório.');
    if (transaction.amount === undefined) throw new Error('O valor é obrigatório.');
    if (!transaction.description) throw new Error('A descrição é obrigatória.');
    if (!transaction.category_id) throw new Error('A categoria é obrigatória.');
    if (!transaction.date) throw new Error('A data é obrigatória.');
    
    const newId = doc(collection(db, 'transactions')).id;
    const newTransaction = {
      id: newId,
      user_id: transaction.userId || auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email || 'Usuário',
      account_id: 'default',
      type: transaction.type,
      category_id: transaction.category_id,
      investment_category_id: transaction.investment_category_id || null,
      amount: transaction.amount,
      description: transaction.description,
      date: new Date(transaction.date),
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      status: transaction.status || 'concluído',
      source: transaction.source || 'manual'
    };
    await setDoc(doc(db, 'transactions', newId), newTransaction);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { description: transaction.description, amount: transaction.amount });
    await addXP(auth.currentUser.uid, 10);
  };

  const updateTransaction = async (id: string, transaction: Partial<Omit<Transaction, 'id' | 'organizationId' | 'userId' | 'createdAt'>>) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    if (!kingdom) throw new Error('Reino não encontrado.');
    if (!role) throw new Error('Papel de usuário não definido.');
    if (!canEditTransaction(role)) throw new Error('Sem permissão para editar transações');
    
    const updateData: any = {};
    if (transaction.type) updateData.type = transaction.type;
    if (transaction.category_id) updateData.category_id = transaction.category_id;
    if (transaction.investment_category_id !== undefined) updateData.investment_category_id = transaction.investment_category_id;
    if (transaction.amount !== undefined) updateData.amount = transaction.amount;
    if (transaction.description) updateData.description = transaction.description;
    if (transaction.date) updateData.date = new Date(transaction.date);
    if (transaction.status) updateData.status = transaction.status;
    if (transaction.source) updateData.source = transaction.source;
    
    await setDoc(doc(db, 'transactions', id), updateData, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { updates: updateData });
  };

  const deleteTransaction = async (id: string) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    if (!kingdom) throw new Error('Reino não encontrado.');
    if (!role) throw new Error('Papel de usuário não definido.');
    if (!canDeleteTransaction(role)) throw new Error('Sem permissão para deletar transações');
    
    await deleteDoc(doc(db, 'transactions', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, {});
  };

  const updateAsset = async (asset: Omit<Asset, 'organizationId'>) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    if (!kingdom) throw new Error('Reino não encontrado.');
    if (!role) throw new Error('Papel de usuário não definido.');
    if (!hasPermission(role, 'EDIT_ASSET')) throw new Error('Sem permissão para editar ativos');
    
    const newId = asset.id || doc(collection(db, 'investments')).id;
    const newInvestment = {
      id: newId,
      user_id: auth.currentUser.uid,
      type: asset.type || 'stock',
      ticker: asset.segment || 'Investimento',
      quantity: 1,
      average_price: asset.value || 0,
      invested_value: asset.value || 0,
      current_value: asset.value || 0,
      earnings: 0,
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    await setDoc(doc(db, 'investments', newId), newInvestment);
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_ASSET', newId, { ticker: asset.segment });
  };

  const addInvestment = async (investment: { 
    type: string, 
    ticker: string, 
    value: number, 
    quantity: number, 
    operation_date: string 
  }) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    if (!kingdom) throw new Error('Reino não encontrado.');
    if (!role) throw new Error('Papel de usuário não definido.');
    if (!hasPermission(role, 'CREATE_ASSET')) throw new Error('Sem permissão para criar ativos');
    
    const batch = writeBatch(db);
    const newId = doc(collection(db, 'investments')).id;
    const newInvestment = {
      id: newId,
      user_id: auth.currentUser.uid,
      type: investment.type,
      ticker: investment.ticker,
      quantity: investment.quantity,
      average_price: investment.value / investment.quantity,
      invested_value: investment.value,
      current_value: investment.value,
      earnings: 0,
      operation_date: investment.operation_date,
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    batch.set(doc(db, 'investments', newId), newInvestment);

    const newTransactionId = doc(collection(db, 'transactions')).id;
    const newTransaction = {
      id: newTransactionId,
      user_id: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email || 'Usuário',
      account_id: 'default',
      type: 'investment',
      category_id: 'investment',
      amount: investment.value,
      description: `Aporte em ${investment.ticker} (${investment.quantity} unidades)`,
      date: new Date(investment.operation_date),
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      status: 'concluído',
      source: 'investimento'
    };
    batch.set(doc(db, 'transactions', newTransactionId), newTransaction);

    await batch.commit();
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_ASSET', newId, { ticker: investment.ticker, value: investment.value });
    const xpGained = calculateXPFromInvestments(investment.value);
    await addXP(auth.currentUser.uid, xpGained);
  };

  const sellInvestment = async (investmentId: string, quantity: number, value: number, operation_date: string) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    if (!kingdom) throw new Error('Reino não encontrado.');
    if (!role) throw new Error('Papel de usuário não definido.');
    if (!hasPermission(role, 'CREATE_ASSET')) throw new Error('Sem permissão para vender ativos');
    
    const assetRef = doc(db, 'investments', investmentId);
    const assetSnap = await getDoc(assetRef);
    if (!assetSnap.exists()) throw new Error('Ativo não encontrado.');
    
    const assetData = assetSnap.data();
    const newQuantity = assetData.quantity - quantity;
    const newInvestedValue = assetData.invested_value - (assetData.average_price * quantity);
    
    const batch = writeBatch(db);
    if (newQuantity <= 0) {
      batch.delete(assetRef);
    } else {
      batch.update(assetRef, {
        quantity: newQuantity,
        invested_value: newInvestedValue,
        current_value: newInvestedValue
      });
    }
    
    const newTransactionId = doc(collection(db, 'transactions')).id;
    const newTransaction = {
      id: newTransactionId,
      user_id: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email || 'Usuário',
      account_id: 'default',
      type: 'investment',
      category_id: 'investment',
      amount: value,
      description: `Venda de ${assetData.ticker} (${quantity} unidades)`,
      date: new Date(operation_date),
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      status: 'concluído',
      source: 'investimento'
    };
    batch.set(doc(db, 'transactions', newTransactionId), newTransaction);
    
    await batch.commit();
    await logActivity(kingdom.id, auth.currentUser.uid, 'SELL_ASSET', investmentId, { ticker: assetData.ticker, value: value });
  };

  const addEarning = async (earning: {
    ticker: string;
    amount: number;
    type: 'dividend' | 'jcp' | 'rent' | 'other';
    date: string;
  }) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    if (!kingdom) throw new Error('Reino não encontrado.');
    if (!role) throw new Error('Papel de usuário não definido.');
    if (!hasPermission(role, 'CREATE_TRANSACTION')) throw new Error('Sem permissão para registrar proventos');

    const newTransactionId = doc(collection(db, 'transactions')).id;
    const earningCategory = categories.find(c => c.name.includes('Investimentos (juros/dividendos)'));
    
    const newTransaction = {
      id: newTransactionId,
      user_id: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email || 'Usuário',
      account_id: 'default',
      type: 'income',
      category_id: earningCategory?.id || 'proventos',
      amount: earning.amount,
      description: `Provento de ${earning.ticker.toUpperCase()} (${earning.type})`,
      date: new Date(earning.date),
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid,
      status: 'concluído',
      source: 'investimento'
    };

    await setDoc(doc(db, 'transactions', newTransactionId), newTransaction);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newTransactionId, { ticker: earning.ticker, amount: earning.amount });
    await addXP(auth.currentUser.uid, 10);
  };

  return { 
    kingdom, 
    role, 
    memberId, 
    loading: loading || dataLoading, 
    joinKingdomByCode,
    assets,
    transactions,
    activityLogs,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    updateAsset,
    addInvestment,
    sellInvestment,
    addEarning
  };
}

// Keep other hooks for now as they are specific
export function useKingdomMembers(kingdomId: string | undefined) {
  const [members, setMembers] = useState<KingdomMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kingdomId) {
      setMembers([]);
      setLoading(false);
      return;
    }

    const membersRef = collection(db, 'kingdom_members');
    const q = query(membersRef, where('kingdom_id', '==', kingdomId));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedMembers = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as KingdomMember);
      
      const membersWithDetails = await Promise.all(loadedMembers.map(async (member) => {
        const userDoc = await getDoc(doc(db, 'users', member.user_id));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          return {
            ...member,
            user_name: userData.name || userData.displayName || 'Herói',
            user_email: userData.email
          };
        }
        return member;
      }));
      
      setMembers(membersWithDetails);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'kingdom_members');
    });

    return () => unsubscribe();
  }, [kingdomId]);

  return { members, loading };
}

export function useKingdomInvites(email: string | undefined) {
  const [invites, setInvites] = useState<KingdomInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      setInvites([]);
      setLoading(false);
      return;
    }

    const invitesRef = collection(db, 'kingdom_invites');
    const q = query(invitesRef, where('email', '==', email), where('status', '==', 'pending'));

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const loadedInvites = snapshot.docs.map(doc => doc.data() as KingdomInvite);
      
      for (const invite of loadedInvites) {
        const k = await kingdomService.getKingdom(invite.kingdom_id);
        if (k) invite.kingdom_name = k.name;
      }
      
      setInvites(loadedInvites);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'kingdom_invites');
    });

    return () => unsubscribe();
  }, [email]);

  return { invites, loading };
}

