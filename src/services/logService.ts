import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { Log } from '@/types';

export const logService = {
  async createLog(organizationId: string, userId: string, action: string, metadata?: any) {
    try {
      const logsRef = collection(db, 'logs');
      await addDoc(logsRef, {
        organizationId,
        userId,
        action,
        metadata: metadata || null,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error creating log:', error);
    }
  }
};
