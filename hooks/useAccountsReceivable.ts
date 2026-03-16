import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, where, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { AccountReceivable } from '@/lib/types';

export function useAccountsReceivable() {
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setReceivables([]);
        setLoading(false);
        return;
      }

      const receivablesRef = collection(db, 'accounts_receivable');
      const receivablesQuery = query(receivablesRef, where('userId', '==', user.uid), orderBy('dueDate', 'asc'));

      const unsubscribeReceivables = onSnapshot(receivablesQuery, (snapshot) => {
        if (!snapshot.empty) {
          const loadedReceivables = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as AccountReceivable));
          
          // Auto-update defaulted status on client side for display
          const today = new Date().toISOString().split('T')[0];
          const updatedReceivables = loadedReceivables.map(r => {
            if (r.status === 'pending' && r.dueDate < today) {
              return { ...r, status: 'defaulted' as const };
            }
            return r;
          });
          
          setReceivables(updatedReceivables);
        } else {
          setReceivables([]);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching accounts receivable:', error);
        setLoading(false);
      });

      return () => {
        unsubscribeReceivables();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const addReceivable = async (receivable: Omit<AccountReceivable, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser) return;
    const newId = doc(collection(db, 'accounts_receivable')).id;
    const newReceivable: AccountReceivable = {
      ...receivable,
      id: newId,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'accounts_receivable', newId), newReceivable);
  };

  const updateReceivable = async (id: string, receivable: Partial<AccountReceivable>) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'accounts_receivable', id), receivable, { merge: true });
  };

  const deleteReceivable = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'accounts_receivable', id));
  };

  return { receivables, loading, addReceivable, updateReceivable, deleteReceivable };
}
