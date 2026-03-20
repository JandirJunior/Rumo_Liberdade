import { useState, useEffect } from 'react';
import { db, auth } from '@/services/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, where, deleteDoc, runTransaction } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CreditCardInvoice } from '@/types';
import { useKingdom } from './useKingdom';
import { getCollectionByKingdom, handleFirestoreError, OperationType } from '@/services/firebaseUtils';
import { canCreateTransaction, canEditTransaction, canDeleteTransaction } from '@/lib/permissionEngine';
import { logActivity } from '@/lib/auditLogger';

export function useCreditCardInvoices() {
  const [invoices, setInvoices] = useState<CreditCardInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const { kingdom, role, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    if (kingdomLoading) return;

    if (!kingdom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setInvoices([]);
      setLoading(false);
      return;
    }

    const invoicesQuery = query(
      getCollectionByKingdom('credit_card_invoices', kingdom.id),
      orderBy('dueDate', 'asc')
    );

    const unsubscribeInvoices = onSnapshot(invoicesQuery, (snapshot) => {
      if (!snapshot.empty) {
        const loadedInvoices = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CreditCardInvoice));
        
        // Auto-update overdue status on client side for display
        const today = new Date().toISOString().split('T')[0];
        const updatedInvoices = loadedInvoices.map(i => {
          if (i.status === 'open' && i.dueDate && i.dueDate < today) {
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
      handleFirestoreError(error, OperationType.GET, `credit_card_invoices (kingdom: ${kingdom.id})`);
      setLoading(false);
    });

    return () => {
      unsubscribeInvoices();
    };
  }, [kingdom, kingdomLoading]);

  const addInvoice = async (invoice: Omit<CreditCardInvoice, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canCreateTransaction(role)) {
      throw new Error('Sem permissão para criar faturas de cartão.');
    }

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
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'credit_card_invoice', amount: invoice.total_amount });
  };

  const updateInvoice = async (id: string, invoice: Partial<CreditCardInvoice>) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditTransaction(role)) {
      throw new Error('Sem permissão para editar faturas de cartão.');
    }

    await setDoc(doc(db, 'credit_card_invoices', id), invoice, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'credit_card_invoice', updates: invoice });
  };

  const payInvoice = async (id: string, paidAt: string) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditTransaction(role)) {
      throw new Error('Sem permissão para editar faturas de cartão.');
    }

    const docRef = doc(db, 'credit_card_invoices', id);
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) {
        throw new Error('Fatura não encontrada.');
      }
      const data = docSnap.data() as CreditCardInvoice;
      if (data.status === 'paid') {
        throw new Error('Esta fatura já foi paga por outro membro.');
      }
      transaction.update(docRef, { status: 'paid', paidAt });
    });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'credit_card_invoice', status: 'paid' });
  };

  const deleteInvoice = async (id: string) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canDeleteTransaction(role)) {
      throw new Error('Sem permissão para deletar faturas de cartão.');
    }

    await deleteDoc(doc(db, 'credit_card_invoices', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, { type: 'credit_card_invoice' });
  };

  return { invoices, loading, addInvoice, updateInvoice, payInvoice, deleteInvoice };
}
