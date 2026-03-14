import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { UserEntity } from '../../lib/financialEngine';

export const userService = {
  async createUser(userId: string, email: string, name?: string): Promise<UserEntity> {
    const userRef = doc(db, 'users', userId);
    const newUser: UserEntity = {
      id: userId,
      email,
      name: name || '',
      level: 1,
      xp: 0,
      created_at: new Date()
    };

    await setDoc(userRef, {
      ...newUser,
      created_at: serverTimestamp()
    });

    return newUser;
  },

  async getUser(userId: string): Promise<UserEntity | null> {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserEntity;
    }
    return null;
  }
};
