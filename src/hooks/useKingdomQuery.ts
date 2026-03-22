// src/hooks/useKingdomQuery.ts
import { query, where, collection } from "firebase/firestore";
import { db } from "@/lib/firebase";

export function kingdomQuery(collectionName: string, kingdomId: string) {
  return query(
    collection(db, collectionName),
    where("kingdom_id", "==", kingdomId)
  );
}
