import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, where, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { AccountPayable } from '@/lib/types';

export function useAccountsPayable() {
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setPayables([]);
        setLoading(false);
        return;
      }

      const payablesRef = collection(db, 'accounts_payable');
      const payablesQuery = query(payablesRef, where('userId', '==', user.uid), orderBy('dueDate', 'asc'));

      const unsubscribePayables = onSnapshot(payablesQuery, (snapshot) => {
        if (!snapshot.empty) {
          const loadedPayables = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as AccountPayable));
          
          // Auto-update overdue status on client side for display
          const today = new Date().toISOString().split('T')[0];
          const updatedPayables = loadedPayables.map(p => {
            if (p.status === 'pending' && p.dueDate < today) {
              return { ...p, status: 'overdue' as const };
            }
            return p;
          });
          
          setPayables(updatedPayables);
        } else {
          setPayables([]);
        }
        setLoading(false);
      }, (error) => {
        console.error('Error fetching accounts payable:', error);
        setLoading(false);
      });

      return () => {
        unsubscribePayables();
      };
    });

    return () => unsubscribeAuth();
  }, []);

  const addPayable = async (payable: Omit<AccountPayable, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser) return;
    const newId = doc(collection(db, 'accounts_payable')).id;
    const newPayable: AccountPayable = {
      ...payable,
      id: newId,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString()
    };
    await setDoc(doc(db, 'accounts_payable', newId), newPayable);
  };

  const updatePayable = async (id: string, payable: Partial<AccountPayable>) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'accounts_payable', id), payable, { merge: true });
  };

  const deletePayable = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'accounts_payable', id));
  };

  return { payables, loading, addPayable, updatePayable, deletePayable };
}
