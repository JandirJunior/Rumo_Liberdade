/**
 * 🔥 firebaseUtils.ts
 *
 * Centraliza helpers do Firestore
 * - Multi-tenant (Kingdom)
 * - Tratamento de erros
 * - Queries padronizadas
 */

import { collection, query, where } from 'firebase/firestore';
import { db } from './firebase';

/**
 * 📌 ENUM DE OPERAÇÕES (LOG)
 */
export enum OperationType {
  GET = 'GET',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE'
}

/**
 * 🧠 FUNÇÃO MAIS IMPORTANTE DO SISTEMA
 *
 * Retorna uma collection já filtrada por kingdom_id
 *
 * 👉 PADRÃO OBRIGATÓRIO DO PROJETO:
 * TODOS os dados são multi-tenant
 */
export function getCollectionByKingdom(
  collectionName: string,
  kingdomId: string
) {
  if (!collectionName) {
    throw new Error('collectionName é obrigatório');
  }

  if (!kingdomId) {
    throw new Error('kingdomId é obrigatório');
  }

  return query(
    collection(db, collectionName),
    where('kingdom_id', '==', kingdomId)
  );
}

/**
 * ⚠️ HANDLER PADRÃO DE ERROS
 */
export function handleFirestoreError(
  error: any,
  operation: OperationType,
  entity: string
) {
  console.error(`🔥 Firestore Error [${operation}] em ${entity}:`, error);

  // Você pode evoluir isso depois:
  // - Log remoto
  // - Sentry
  // - Notificação

  throw new Error(`Erro ao ${operation} ${entity}`);
}