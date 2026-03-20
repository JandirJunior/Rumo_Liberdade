import { useState, useEffect } from 'react';
import { db, auth } from '@/services/firebase';
import { collection, onSnapshot, query, setDoc, doc, where, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CreditCard } from '@/types';
import { useKingdom } from './useKingdom';
import { getCollectionByKingdom, handleFirestoreError, OperationType } from '@/services/firebaseUtils';
import { canCreateTransaction, canEditTransaction, canDeleteTransaction } from '@/lib/permissionEngine';
import { logActivity } from '@/lib/auditLogger';

export function useCreditCards() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { kingdom, role, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    if (kingdomLoading) return;

    if (!kingdom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreditCards([]);
      setLoading(false);
      return;
    }

    const cardsQuery = getCollectionByKingdom('credit_cards', kingdom.id);

    const unsubscribeCards = onSnapshot(cardsQuery, (snapshot) => {
      if (!snapshot.empty) {
        const loadedCards = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as CreditCard));
        setCreditCards(loadedCards);
      } else {
        setCreditCards([]);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `credit_cards (kingdom: ${kingdom.id})`);
      setLoading(false);
    });

    return () => {
      unsubscribeCards();
    };
  }, [kingdom, kingdomLoading]);

  const addCreditCard = async (card: Omit<CreditCard, 'id' | 'userId'>) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canCreateTransaction(role)) {
      throw new Error('Sem permissão para criar cartões de crédito.');
    }

    const newId = doc(collection(db, 'credit_cards')).id;
    const newCard: CreditCard = {
      ...card,
      id: newId,
      userId: auth.currentUser.uid,
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    await setDoc(doc(db, 'credit_cards', newId), newCard);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_TRANSACTION', newId, { type: 'credit_card', name: card.name });
  };

  const updateCreditCard = async (id: string, card: Partial<CreditCard>) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditTransaction(role)) {
      throw new Error('Sem permissão para editar cartões de crédito.');
    }

    await setDoc(doc(db, 'credit_cards', id), card, { merge: true });
    await logActivity(kingdom.id, auth.currentUser.uid, 'UPDATE_TRANSACTION', id, { type: 'credit_card', updates: card });
  };

  const deleteCreditCard = async (id: string) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canDeleteTransaction(role)) {
      throw new Error('Sem permissão para deletar cartões de crédito.');
    }

    await deleteDoc(doc(db, 'credit_cards', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_TRANSACTION', id, { type: 'credit_card' });
  };

  return { creditCards, loading, addCreditCard, updateCreditCard, deleteCreditCard };
}
