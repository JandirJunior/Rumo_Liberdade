import { useState, useEffect } from 'react';
import { db, auth } from '@/services/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, where, deleteDoc, runTransaction } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { AccountPayable } from '@/types';
import { useKingdom } from './useKingdom';
import { getCollectionByKingdom, handleFirestoreError, OperationType } from '@/services/firebaseUtils';
import { canCreateTransaction, canEditTransaction, canDeleteTransaction } from '@/lib/permissionEngine';
import { logActivity } from '@/lib/auditLogger';

export function useAccountsPayable() {
  const [payables, setPayables] = useState<AccountPayable[]>([]);
  const [loading, setLoading] = useState(true);
  const { kingdom, role, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    if (kingdomLoading) return;

    if (!kingdom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPayables([]);
      setLoading(false);
      return;
    }

    const payablesQuery = query(
      getCollectionByKingdom('accounts_payable', kingdom.id),
      orderBy('dueDate', 'asc')
    );

    const unsubscribePayables = onSnapshot(payablesQuery, (snapshot) => {
      if (!snapshot.empty) {
        const loadedPayables = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as AccountPayable));
        
        // Auto-update overdue status on client side for display
        const today = new Date().toISOString().split('T')[0];
        const updatedPayables = loadedPayables.map(p => {
          const dueDate = p.due_date || p.dueDate || '';
          if (p.status === 'pendente' && dueDate && dueDate < today) {
            return { ...p, status: 'atrasado' as const };
          }
          return p;
        });
        
        setPayables(updatedPayables);
      } else {
        setPayables([]);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `accounts_payable (kingdom: ${kingdom.id})`);
      setLoading(false);
    });

    return () => {
      unsubscribePayables();
    };
  }, [kingdom, kingdomLoading]);

  const addPayable = async (payable: Omit<AccountPayable, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    if (!kingdom) throw new Error('Reino não encontrado.');
    if (!role) throw new Error('Papel de usuário não definido.');
    
    if (!canCreateTransaction(role)) {
      throw new Error('Sem permissão para criar contas a pagar.');
    }

    const installments = payable.installments && payable.installments > 1 ? payable.installments : 1;
    const baseAmount = payable.amount / installments;
    
    // Create multiple payables if installments > 1
    for (let i = 0; i < installments; i++) {
      const newId = doc(collection(db, 'accounts_payable')).id;
      
      // Calculate due date for each installment
      const rawDueDate = payable.due_date || payable.dueDate || new Date().toISOString();
      let dueDate = new Date(rawDueDate);
      dueDate.setMonth(dueDate.getMonth() + i);
      const dueDateStr = dueDate.toISOString().split('T')[0];

      const newPayable: AccountPayable = {
        ...payable,
        id: newId,
        amount: baseAmount,
        due_date: dueDateStr,
        dueDate: dueDateStr,
        installments: installments,
        currentInstallment: i + 1,
        userId: auth.currentUser.uid,
        createdAt: new Date().toISOString(),
        kingdom_id: kingdom.id,
        created_by: auth.currentUser.uid
      };
      
      // Remove undefined fields
      Object.keys(newPayable).forEach(key => {
        if (newPayable[key as keyof AccountPayable] === undefined) {
          delete newPayable[key as keyof AccountPayable];
        }
      });

      await setDoc(doc(db, 'accounts_payable', newId), newPayable);
      await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'payable', amount: baseAmount, installment: `${i+1}/${installments}` });
    }
  };

  const updatePayable = async (id: string, payable: Partial<AccountPayable>) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditTransaction(role)) {
      throw new Error('Sem permissão para editar contas a pagar.');
    }

    // Remove undefined fields
    const sanitizedPayable = { ...payable };
    Object.keys(sanitizedPayable).forEach(key => {
      if (sanitizedPayable[key as keyof AccountPayable] === undefined) {
        delete sanitizedPayable[key as keyof AccountPayable];
      }
    });

    await setDoc(doc(db, 'accounts_payable', id), sanitizedPayable, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'payable', updates: sanitizedPayable });
  };

  const payPayable = async (id: string, paidAt: string) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditTransaction(role)) {
      throw new Error('Sem permissão para editar contas a pagar.');
    }

    const docRef = doc(db, 'accounts_payable', id);
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) {
        throw new Error('Conta a pagar não encontrada.');
      }
      const data = docSnap.data() as AccountPayable;
      if (data.status === 'pago') {
        throw new Error('Esta conta já foi paga por outro membro.');
      }
      transaction.update(docRef, { status: 'pago', paidAt });
    });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'payable', status: 'paid' });
  };

  const deletePayable = async (id: string) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canDeleteTransaction(role)) {
      throw new Error('Sem permissão para deletar contas a pagar.');
    }

    await deleteDoc(doc(db, 'accounts_payable', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, { type: 'payable' });
  };

  return { payables, loading, addPayable, updatePayable, payPayable, deletePayable };
}
