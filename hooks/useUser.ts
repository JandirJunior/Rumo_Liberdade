import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { AppUser } from '@/lib/types';

export function useUser() {
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const userRef = doc(db, 'users', auth.currentUser.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserData(docSnap.data() as AppUser);
      }
      setLoading(false);
    }, (error) => {
      console.error("Error fetching user data:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [auth.currentUser]);

  return { userData, loading };
}
