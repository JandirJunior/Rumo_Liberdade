/**
 * 📩 useKingdomInvites
 * 
 * Controla convites pendentes do usuário
 */

import { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { KingdomInvite } from '@/types';

export function useKingdomInvites(email?: string) {
  const [invites, setInvites] = useState<KingdomInvite[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!email) {
      const timer = setTimeout(() => {
        setInvites([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const q = query(
      collection(db, 'kingdom_invites'),
      where('email', '==', email),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      })) as KingdomInvite[];

      setInvites(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [email]);

  return { invites, loading };
}