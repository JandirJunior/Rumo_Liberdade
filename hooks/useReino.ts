/**
 * Hook customizado para gerenciar os dados do Reino (ativos e transações).
 * Busca dados do Firestore.
 */
import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, where } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { Asset, Transaction } from '@/lib/types';
import { MOCK_ASSETS, MOCK_TRANSACTIONS } from '@/lib/data';
import { addXP, calculateXPFromInvestments } from '@/lib/gameEngine';

export function useReino() {
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setAssets([]);
        setTransactions([]);
        setLoading(false);
        return;
      }

      const assetsRef = collection(db, 'investments');
      const assetsQuery = query(assetsRef, where('user_id', '==', user.uid));

      const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const loadedAssets = snapshot.docs.map(doc => {
            const data = doc.data();
            // Map InvestmentEntity to Asset for backward compatibility
            return {
              id: doc.id,
              userId: data.user_id,
              name: data.ticker || 'Investimento',
              value: data.current_value || 0,
              faceroType: data.type === 'fii' ? 'F' : data.type === 'stock' ? 'A' : data.type === 'crypto' ? 'C' : data.type === 'etf' ? 'E' : data.type === 'fixed_income' ? 'R' : 'O',
              type: data.type,
              yield: data.earnings || 0,
              color: 'bg-emerald-500' // Default color
            } as Asset;
          });
          setAssets(loadedAssets);
        } else {
          setAssets([]);
        }
      }, (error) => {
        console.error('Error fetching assets:', error);
      });

      const transactionsRef = collection(db, 'transactions');
      const transactionsQuery = query(transactionsRef, where('user_id', '==', user.uid), orderBy('created_at', 'desc'));

      const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
        if (!snapshot.empty) {
          const loadedTransactions = snapshot.docs.map(doc => {
            const data = doc.data();
            // Map TransactionEntity to Transaction for backward compatibility
            return {
              id: doc.id,
              userId: data.user_id,
              amount: data.amount,
              type: data.type,
              title: data.description || 'Transação',
              description: data.description || 'Transação',
              category: data.category || 'Outros',
              category_id: data.category_id || '',
              date: data.date ? new Date(data.date.seconds * 1000).toISOString() : new Date().toISOString(),
              createdAt: data.created_at ? new Date(data.created_at.seconds * 1000).toISOString() : new Date().toISOString()
            } as Transaction;
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

      return () => {
        unsubscribeAssets();
        unsubscribeTransactions();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const addTransaction = async (transaction: Omit<Transaction, 'id' | 'organizationId'>) => {
    if (!auth.currentUser) return;
    const newId = doc(collection(db, 'transactions')).id;
    const newTransaction = {
      id: newId,
      user_id: auth.currentUser.uid,
      account_id: 'default', // Placeholder
      type: transaction.type,
      category: transaction.category || 'Outros',
      category_id: transaction.category_id || '',
      amount: transaction.amount,
      description: transaction.description || transaction.title || 'Transação',
      date: new Date(),
      created_at: new Date()
    };
    await setDoc(doc(db, 'transactions', newId), newTransaction);
    
    // Add XP for registering a transaction (e.g., 10 XP per transaction)
    await addXP(auth.currentUser.uid, 10);
  };

  const updateTransaction = async (id: string, transaction: Partial<Omit<Transaction, 'id' | 'organizationId' | 'userId' | 'createdAt'>>) => {
    if (!auth.currentUser) return;
    const updateData: any = {};
    if (transaction.type) updateData.type = transaction.type;
    if (transaction.category) updateData.category = transaction.category;
    if (transaction.category_id) updateData.category_id = transaction.category_id;
    if (transaction.amount !== undefined) updateData.amount = transaction.amount;
    if (transaction.description || transaction.title) updateData.description = transaction.description || transaction.title;
    if (transaction.date) updateData.date = new Date(transaction.date);
    
    await setDoc(doc(db, 'transactions', id), updateData, { merge: true });
  };

  const deleteTransaction = async (id: string) => {
    if (!auth.currentUser) return;
    const { deleteDoc } = await import('firebase/firestore');
    await deleteDoc(doc(db, 'transactions', id));
  };

  const updateAsset = async (asset: Omit<Asset, 'organizationId'>) => {
    if (!auth.currentUser) return;
    const newId = asset.id || doc(collection(db, 'investments')).id;
    const newInvestment = {
      id: newId,
      user_id: auth.currentUser.uid,
      type: asset.type || 'stock',
      ticker: asset.name || 'Investimento',
      quantity: 1,
      average_price: asset.value || 0,
      invested_value: asset.value || 0,
      current_value: asset.value || 0,
      earnings: asset.yield || 0
    };
    await setDoc(doc(db, 'investments', newId), newInvestment);
  };

  const addInvestment = async (investment: { type: string, ticker: string, value: number }) => {
    if (!auth.currentUser) return;
    const { doc, collection, setDoc, writeBatch } = await import('firebase/firestore');
    const batch = writeBatch(db);

    const newId = doc(collection(db, 'investments')).id;
    const newInvestment = {
      id: newId,
      user_id: auth.currentUser.uid,
      type: investment.type,
      ticker: investment.ticker,
      quantity: 1,
      average_price: investment.value,
      invested_value: investment.value,
      current_value: investment.value,
      earnings: 0,
      created_at: new Date()
    };
    batch.set(doc(db, 'investments', newId), newInvestment);

    const newTransactionId = doc(collection(db, 'transactions')).id;
    const newTransaction = {
      id: newTransactionId,
      user_id: auth.currentUser.uid,
      account_id: 'default',
      type: 'investment',
      category: 'Investimento',
      category_id: 'investment_auto',
      amount: investment.value,
      description: `Aporte em ${investment.ticker}`,
      date: new Date().toISOString().split('T')[0],
      created_at: new Date()
    };
    batch.set(doc(db, 'transactions', newTransactionId), newTransaction);

    await batch.commit();
    
    // Add XP for investing
    const xpGained = calculateXPFromInvestments(investment.value);
    await addXP(auth.currentUser.uid, xpGained);
  };

  return { assets, transactions, loading, addTransaction, updateTransaction, deleteTransaction, updateAsset, addInvestment };
}
