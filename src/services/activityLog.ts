// src/services/activityLog.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/services/firebase";

export async function logActivity(
  kingdomId: string,
  userId: string,
  action: string,
  details?: Record<string, unknown>
) {
  await addDoc(collection(db, "activityLogs"), {
    kingdom_id: kingdomId,
    user_id: userId,
    action,
    details,
    created_at: serverTimestamp(),
  });
}
