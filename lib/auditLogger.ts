import { collection, addDoc, serverTimestamp, getDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';

export type AuditAction = 
  | 'CREATE_TRANSACTION'
  | 'UPDATE_TRANSACTION'
  | 'DELETE_TRANSACTION'
  | 'PAY_BILL'
  | 'RECEIVE_VALUE'
  | 'CREATE_INVESTMENT'
  | 'CREATE_ASSET'
  | 'UPDATE_ASSET'
  | 'INVITE_USER'
  | 'INVITE_SENT'
  | 'ACCEPT_INVITE'
  | 'USER_JOINED'
  | 'USER_LEFT'
  | 'ROLE_UPDATED'
  | 'CREATE_CATEGORY'
  | 'DELETE_CATEGORY';

export async function logActivity(
  kingdomId: string,
  userId: string,
  action: AuditAction | string,
  entityId: string,
  details?: any
) {
  if (!kingdomId || !userId) return;
  
  try {
    let userName = 'Membro';
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        userName = userDoc.data().name || 'Membro';
      }
    } catch (e) {
      console.error('Error fetching user name for log', e);
    }

    const logsRef = collection(db, 'activity_logs');
    await addDoc(logsRef, {
      kingdom_id: kingdomId,
      user_id: userId,
      user_name: userName,
      action,
      entity_id: entityId,
      details: details || null,
      created_at: serverTimestamp()
    });
  } catch (error) {
    console.error('Failed to log activity:', error);
  }
}
