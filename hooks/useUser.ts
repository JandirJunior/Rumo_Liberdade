import { useState, useEffect } from 'react';
import { auth, db } from '@/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '@/lib/firebaseUtils';
import { onAuthStateChanged } from 'firebase/auth';
import { UserEntity } from '@/lib/financialEngine';

export function useUser() {
  const [userData, setUserData] = useState<UserEntity | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (!user) {
        setUserData(null);
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', user.uid);
      const unsubscribeDoc = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data() as UserEntity);
        }
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
        setLoading(false);
      });

      return () => unsubscribeDoc();
    });

    return () => unsubscribeAuth();
  }, []);

  return { userData, loading };
}
