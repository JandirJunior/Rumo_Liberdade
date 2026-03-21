/**
 * 📜 auditLogger
 */

import { db } from '@/services/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

export async function logActivity(
  kingdomId: string,
  userId: string,
  action: string,
  entityId?: string
) {
  const id = doc(collection(db, 'activity_logs')).id;

  await setDoc(doc(db, 'activity_logs', id), {
    id,
    kingdom_id: kingdomId,
    user_id: userId,
    action,
    entity_id: entityId || null,
    created_at: new Date()
  });
}