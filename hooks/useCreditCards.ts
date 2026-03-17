import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, setDoc, doc, where, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CreditCard } from '@/lib/types';
import { useKingdom } from './useKingdom';

export function useCreditCards() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);
  const { kingdom, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    if (kingdomLoading) return;

    if (!kingdom) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCreditCards([]);
      setLoading(false);
      return;
    }

    const cardsRef = collection(db, 'credit_cards');
    const cardsQuery = query(cardsRef, where('kingdom_id', '==', kingdom.id));

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
      console.error('Error fetching credit cards:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeCards();
    };
  }, [kingdom, kingdomLoading]);

  const addCreditCard = async (card: Omit<CreditCard, 'id' | 'userId'>) => {
    if (!auth.currentUser || !kingdom) return;
    const newId = doc(collection(db, 'credit_cards')).id;
    const newCard: CreditCard = {
      ...card,
      id: newId,
      userId: auth.currentUser.uid,
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    await setDoc(doc(db, 'credit_cards', newId), newCard);
  };

  const updateCreditCard = async (id: string, card: Partial<CreditCard>) => {
    if (!auth.currentUser) return;
    await setDoc(doc(db, 'credit_cards', id), card, { merge: true });
  };

  const deleteCreditCard = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'credit_cards', id));
  };

  return { creditCards, loading, addCreditCard, updateCreditCard, deleteCreditCard };
}
