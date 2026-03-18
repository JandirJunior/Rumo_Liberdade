import { collection, query, where, Query } from 'firebase/firestore';
import { db } from '../firebase';

export function getCollectionByKingdom(collectionName: string, kingdomId: string): Query {
  if (!kingdomId) {
    throw new Error(`kingdomId is required to query ${collectionName}`);
  }
  return query(
    collection(db, collectionName),
    where("kingdom_id", "==", kingdomId)
  );
}
