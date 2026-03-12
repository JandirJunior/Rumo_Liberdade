/**
 * Hook customizado para gerenciar os dados do Reino (ativos e transações).
 * Busca dados do Firestore e suporta os modos Herói (solo) e Reino (multiplayer).
 */
import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, where } from 'firebase/firestore';
import { Asset, Transaction } from '@/lib/types';
import { MOCK_ASSETS, MOCK_TRANSACTIONS } from '@/lib/data';
import { useTheme } from '@/lib/ThemeContext';

export function useReino() {
  const { gameMode } = useTheme();
  const [assets, setAssets] = useState<Asset[]>(MOCK_ASSETS);
  const [transactions, setTransactions] = useState<Transaction[]>(MOCK_TRANSACTIONS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const assetsRef = collection(db, 'reino_assets');
    const assetsQuery = gameMode === 'heroi' 
      ? query(assetsRef, where('userId', '==', auth.currentUser.uid))
      : assetsRef;

    const unsubscribeAssets = onSnapshot(assetsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const loadedAssets = snapshot.docs.map(doc => doc.data() as Asset);
        setAssets(loadedAssets);
      } else {
        setAssets(gameMode === 'heroi' ? [] : MOCK_ASSETS); // Fallback to mock se vazio no modo reino
      }
    }, (error) => {
      console.error('Error fetching assets:', error);
    });

    const transactionsRef = collection(db, 'reino_transactions');
    const transactionsQuery = gameMode === 'heroi'
      ? query(transactionsRef, where('userId', '==', auth.currentUser.uid), orderBy('createdAt', 'desc'))
      : query(transactionsRef, orderBy('createdAt', 'desc'));

    const unsubscribeTransactions = onSnapshot(transactionsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const loadedTransactions = snapshot.docs.map(doc => doc.data() as Transaction);
        setTransactions(loadedTransactions);
      } else {
        setTransactions(gameMode === 'heroi' ? [] : MOCK_TRANSACTIONS); // Fallback to mock se vazio no modo reino
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
  }, [gameMode]);

  const addTransaction = async (transaction: Omit<Transaction, 'id'>) => {
    if (!auth.currentUser) return;
    const newId = doc(collection(db, 'reino_transactions')).id;
    const newTransaction = {
      ...transaction,
      id: newId,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email || 'Herói Desconhecido',
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'reino_transactions', newId), newTransaction);
  };

  const updateAsset = async (asset: Asset) => {
    if (!auth.currentUser) return;
    // Ensure we save userId when updating/creating an asset
    const assetWithUser = {
      ...asset,
      userId: auth.currentUser.uid,
      userName: auth.currentUser.displayName || auth.currentUser.email || 'Herói Desconhecido',
    };
    await setDoc(doc(db, 'reino_assets', asset.id), assetWithUser);
  };

  return { assets, transactions, loading, addTransaction, updateAsset };
}
