import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, orderBy, setDoc, doc, where, deleteDoc, runTransaction } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { AccountReceivable } from '@/lib/types';
import { useKingdom } from './useKingdom';
import { getCollectionByKingdom } from '@/lib/firebaseUtils';
import { canCreateTransaction, canEditTransaction, canDeleteTransaction } from '@/lib/permissionEngine';
import { logActivity } from '@/lib/auditLogger';

export function useAccountsReceivable() {
  const [receivables, setReceivables] = useState<AccountReceivable[]>([]);
  const [loading, setLoading] = useState(true);
  const { kingdom, role, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    if (kingdomLoading) return;

    if (!kingdom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setReceivables([]);
      setLoading(false);
      return;
    }

    const receivablesQuery = query(
      getCollectionByKingdom('accounts_receivable', kingdom.id),
      orderBy('dueDate', 'asc')
    );

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
  }, [kingdom, kingdomLoading]);

  const addReceivable = async (receivable: Omit<AccountReceivable, 'id' | 'userId' | 'createdAt'>) => {
    if (!auth.currentUser) throw new Error('Usuário não autenticado.');
    if (!kingdom) throw new Error('Reino não encontrado.');
    if (!role) throw new Error('Papel de usuário não definido.');
    
    if (!canCreateTransaction(role)) {
      throw new Error('Sem permissão para criar contas a receber.');
    }

    const newId = doc(collection(db, 'accounts_receivable')).id;
    const newReceivable: AccountReceivable = {
      ...receivable,
      id: newId,
      userId: auth.currentUser.uid,
      createdAt: new Date().toISOString(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    
    // Remove undefined fields
    Object.keys(newReceivable).forEach(key => {
      if (newReceivable[key as keyof AccountReceivable] === undefined) {
        delete newReceivable[key as keyof AccountReceivable];
      }
    });

    await setDoc(doc(db, 'accounts_receivable', newId), newReceivable);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'receivable', amount: receivable.amount });
  };

  const updateReceivable = async (id: string, receivable: Partial<AccountReceivable>) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditTransaction(role)) {
      throw new Error('Sem permissão para editar contas a receber.');
    }

    // Remove undefined fields
    const sanitizedReceivable = { ...receivable };
    Object.keys(sanitizedReceivable).forEach(key => {
      if (sanitizedReceivable[key as keyof AccountReceivable] === undefined) {
        delete sanitizedReceivable[key as keyof AccountReceivable];
      }
    });

    await setDoc(doc(db, 'accounts_receivable', id), sanitizedReceivable, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'receivable', updates: sanitizedReceivable });
  };

  const receiveReceivable = async (id: string, receivedAt: string) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditTransaction(role)) {
      throw new Error('Sem permissão para editar contas a receber.');
    }

    const docRef = doc(db, 'accounts_receivable', id);
    await runTransaction(db, async (transaction) => {
      const docSnap = await transaction.get(docRef);
      if (!docSnap.exists()) {
        throw new Error('Conta a receber não encontrada.');
      }
      const data = docSnap.data() as AccountReceivable;
      if (data.status === 'received') {
        throw new Error('Esta conta já foi recebida por outro membro.');
      }
      transaction.update(docRef, { status: 'received', receivedAt });
    });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'receivable', status: 'received' });
  };

  const deleteReceivable = async (id: string) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canDeleteTransaction(role)) {
      throw new Error('Sem permissão para deletar contas a receber.');
    }

    await deleteDoc(doc(db, 'accounts_receivable', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, { type: 'receivable' });
  };

  return { receivables, loading, addReceivable, updateReceivable, receiveReceivable, deleteReceivable };
}
