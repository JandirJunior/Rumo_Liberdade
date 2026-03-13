import { doc, getDoc, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { AppUser, Role } from '../../lib/types';
import { logService } from './logService';

export const userService = {
  async createUser(userId: string, organizationId: string, email: string, role: Role, name?: string): Promise<AppUser> {
    const userRef = doc(db, 'users', userId);
    const newUser: AppUser = {
      userId,
      organizationId,
      role,
      email,
      name: name || '',
      createdAt: new Date().toISOString(),
      status: 'active'
    };

    await setDoc(userRef, {
      ...newUser,
      createdAt: serverTimestamp()
    });

    await logService.createLog(organizationId, userId, 'CREATE_USER', { email, role });
    return newUser;
  },

  async getUser(userId: string): Promise<AppUser | null> {
    const userRef = doc(db, 'users', userId);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as AppUser;
    }
    return null;
  }
};
