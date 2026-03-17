import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, where, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CreditCardInvoice } from '@/lib/types';
import { useKingdom } from './useKingdom';

export function useCreditCardInvoices() {
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { kingdom, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    if (kingdomLoading) return;

    if (!kingdom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInvoices([]);
      setLoading(false);
      return;
    }

    const invoicesRef = collection(db, 'credit_card_invoices');
    const invoicesQuery = query(invoicesRef, where('kingdom_id', '==', kingdom.id), orderBy('dueDate', 'asc'));

    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      if (!snapshot.empty) {
        const loadedInvoices = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CreditCardInvoice));
        
        // Auto-update overdue status on client side for display
        const today = new Date().toISOString().split('T')[0];
        const updatedInvoices = loadedInvoices.map(i => {
          if (i.status === 'open' && i.dueDate < today) {
            return { ...i, status: 'overdue' as const };
          }
          return i;
        });
        
        setInvoices(updatedInvoices);
      } else {
        setInvoices([]);
      }
      setLoading(false);
    }, (error) => {
      console.error('Error fetching credit card invoices:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeInvoices();
    };
  }, [kingdom, kingdomLoading]);

  const addInvoice = async (invoice: Omit<CreditCardInvoice, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser || !kingdom) return;
    const newId = doc(collection(db, 'credit_card_invoices')).id;
    const newInvoice: CreditCardInvoice = {
      ...invoice,
      id: newId,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    await setDoc(doc(db, 'credit_card_invoices', newId), newInvoice);
  };

  const updateInvoice = async (id: string, invoice: Partial<CreditCardInvoice>) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'credit_card_invoices', id), invoice, { merge: true });
  };

  const deleteInvoice = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'credit_card_invoices', id));
  };

  return { invoices, loading, addInvoice, updateInvoice, deleteInvoice };
}
