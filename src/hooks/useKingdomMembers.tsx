/**
 * 👥 useKingdomMembers
 * 
 * Responsável por listar membros do Reino
 * NÃO mistura com lógica do useKingdom (boa prática)
 */

import { useEffect, useState } from 'react';
import { db } from '@/services/firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { KingdomMember } from '@/types';

export function useKingdomMembers(kingdomId?: string) {
  const [members, setMembers] = useState<KingdomMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!kingdomId) {
      const timer = setTimeout(() => {
        setMembers([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    const q = query(
      collection(db, 'kingdom_members'),
      where('kingdom_id', '==', kingdomId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data = await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const data = docSnap.data();

          // buscar nome do usuário
          const userDoc = await getDoc(doc(db, 'users', data.user_id));

          return {
            id: docSnap.id,
            ...data,
            user_name: userDoc.exists()
              ? userDoc.data().name || userDoc.data().displayName
              : 'Herói'
          };
        })
      );

      setMembers(data as KingdomMember[]);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [kingdomId]);

  return { members, loading };
}