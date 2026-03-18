/**
 * Hook customizado para gerenciar os dados do Reino (ativos e transações).
 * Busca dados do Firestore.
 */
import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, where, deleteDoc, writeBatch } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Asset, Transaction, ActivityLog } from '@/lib/types';
import { MOCK_ASSETS, MOCK_TRANSACTIONS } from '@/lib/data';
import { addXP, calculateXPFromInvestments } from '@/lib/gameEngine';
import { categoryEngine } from '@/lib/categoryEngine';
import { useKingdom } from './useKingdom';
import { canCreateTransaction, canEditTransaction, canDeleteTransaction, hasPermission } from '@/lib/permissionEngine';
import { logActivity } from '@/lib/auditLogger';
import { getCollectionByKingdom } from '@/lib/firebaseUtils';

export function useReino() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const { kingdom, role, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    if (kingdomLoading) return;

    if (!kingdom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAssets([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTransactions([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setActivityLogs([]);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setLoading(false);
      return;
    }

    const assetsQuery = query(getCollectionByKingdom('investments', kingdom.id));

    const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
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
      console.error('Error fetching assets:', error);
    });

    const transactionsQuery = query(getCollectionByKingdom('transactions', kingdom.id), orderBy('created_at', 'desc'));

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
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
          
          const rawTransaction = {
            id: doc.id,
            userId: data.user_id,
            amount: data.amount,
            type: data.type,
            title: data.description || 'Transação',
            description: data.description || 'Transação',
            category_id: data.category_id,
            date: dateStr,
            createdAt: createdAtStr,
            kingdom_id: data.kingdom_id,
            created_by: data.created_by
          };
          
          return categoryEngine.normalizeTransactionCategory(rawTransaction);
        });
        setTransactions(loadedTransactions);
      } else {
        setTransactions([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching transactions:', error);
      setLoading(false);
    });

    const logsQuery = query(getCollectionByKingdom('activity_logs', kingdom.id), orderBy('created_at', 'desc'));

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
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
      console.error('Error fetching activity logs:', error);
    });

    return () => {
      unsubscribeAssets();
      unsubscribeTransactions();
      unsubscribeLogs();
    };
  }, [kingdom, kingdomLoading]);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'organizationId'>) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canCreateTransaction(role)) throw new Error('Sem permissão para criar transações');
    
    const newId = doc(collection(db, 'transactions')).id;
    const newTransaction = {
      id: newId,
      user_id: auth.currentUser.uid,
      account_id: 'default', // Placeholder
      type: transaction.type,
      category_id: transaction.category_id || '',
      amount: transaction.amount,
      description: transaction.description || 'Transação',
      date: transaction.date ? new Date(transaction.date) : new Date(),
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    await setDoc(doc(db, 'transactions', newId), newTransaction);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { description: transaction.description, amount: transaction.amount });
    
    // Add XP for registering a transaction (e.g., 10 XP per transaction)
    await addXP(auth.currentUser.uid, 10);
  };

  const updateTransaction = async (id: string, transaction: Partial<Omit<Transaction, 'id' | 'organizationId' | 'userId' | 'createdAt'>>) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditTransaction(role)) throw new Error('Sem permissão para editar transações');
    
    const updateData: any = {};
    if (transaction.type) updateData.type = transaction.type;
    if (transaction.category_id) updateData.category_id = transaction.category_id;
    if (transaction.amount !== undefined) updateData.amount = transaction.amount;
    if (transaction.description) updateData.description = transaction.description;
    if (transaction.date) updateData.date = new Date(transaction.date);
    
    await setDoc(doc(db, 'transactions', id), updateData, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { updates: updateData });
  };

  const deleteTransaction = async (id: string) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canDeleteTransaction(role)) throw new Error('Sem permissão para deletar transações');
    
    await deleteDoc(doc(db, 'transactions', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, {});
  };

  const updateAsset = async (asset: Omit<Asset, 'organizationId'>) => {
    if (!auth.currentUser || !kingdom || !role) return;
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
    if (!auth.currentUser || !kingdom || !role) return;
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
      account_id: 'default',
      type: 'investment',
      category_id: 'investment',
      amount: investment.value,
      description: `Aporte em ${investment.ticker} (${investment.quantity} unidades)`,
      date: investment.operation_date,
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    batch.set(doc(db, 'transactions', newTransactionId), newTransaction);

    await batch.commit();
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_ASSET', newId, { ticker: investment.ticker, value: investment.value });
    
    // Add XP for investing
    const xpGained = calculateXPFromInvestments(investment.value);
    await addXP(auth.currentUser.uid, xpGained);
  };

  return { assets, transactions, activityLogs, loading, addTransaction, updateTransaction, deleteTransaction, updateAsset, addInvestment };
}
