import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, where, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { AccountPayable } from '@/lib/types';
import { useKingdom } from './useKingdom';

export function useAccountsPayable() {
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const { kingdom, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    if (kingdomLoading) return;

    if (!kingdom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPayables([]);
      setLoading(false);
      return;
    }

    const payablesRef = collection(db, 'accounts_payable');
    const payablesQuery = query(payablesRef, where('kingdom_id', '==', kingdom.id), orderBy('dueDate', 'asc'));

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
  }, [kingdom, kingdomLoading]);

  const addPayable = async (payable: Omit<AccountPayable, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser || !kingdom) return;
    const newId = doc(collection(db, 'accounts_payable')).id;
    const newPayable: AccountPayable = {
      ...payable,
      id: newId,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
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
