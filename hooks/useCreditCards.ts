import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, setDoc, doc, where, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CreditCard } from '@/lib/types';

export function useCreditCards() {
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setCreditCards([]);
        setLoading(false);
        return;
      }

      const cardsRef = collection(db, 'credit_cards');
      const cardsQuery = query(cardsRef, where('userId', '==', user.uid));

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
    });

    return () => unsubscribeAuth();
  }, []);

  const addCreditCard = async (card: Omit<CreditCard, 'id' | 'userId'>) => {
    if (!auth.currentUser) return;
    const newId = doc(collection(db, 'credit_cards')).id;
    const newCard: CreditCard = {
      ...card,
      id: newId,
      userId: auth.currentUser.uid
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
