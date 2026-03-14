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

  return { assets, transactions, loading, addTransaction, updateAsset };
}
