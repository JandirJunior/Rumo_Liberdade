/**
 * 📜 auditLogger
 */

import { db } from '@/services/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { cleanObject } from '@/services/firebaseUtils';

export async function logActivity(
  kingdomId: string,
  userId: string,
  action: string,
  entityId?: string,
  details?: any
) {
  const id = doc(collection(db, 'activity_logs')).id;

  await setDoc(doc(db, 'activity_logs', id), cleanObject({
    id,
    kingdom_id: kingdomId,
    user_id: userId,
    action,
    entity_id: entityId || null,
    details: details || null,
    created_at: new Date()
  }));
}