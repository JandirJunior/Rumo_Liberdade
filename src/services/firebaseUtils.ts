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
import { safeStringify } from '../lib/utils';

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
  console.error(`🔥 Firestore Error [${operation}] em ${entity}:`, safeStringify(error));

  throw new Error(`Erro ao ${operation} ${entity}`);
}

/**
 * 📅 PARSER DE DATAS DO FIRESTORE
 */
export function parseDate(date: any): Date {
  if (!date) return new Date();
  if (date instanceof Date) return date;
  if (typeof date.toDate === 'function') return date.toDate();
  if (date.seconds) return new Date(date.seconds * 1000);
  
  if (typeof date === 'string' && date.includes('/')) {
    const parts = date.split('/');
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    }
  }

  const d = new Date(date);
  return isNaN(d.getTime()) ? new Date() : d;
}

/**
 * 🧹 LIMPA OBJETOS PARA O FIRESTORE
 *
 * Remove campos undefined que causam erro no Firestore
 */
export function cleanObject(obj: any) {
  if (!obj || typeof obj !== 'object') return obj;
  const newObj = { ...obj };
  Object.keys(newObj).forEach(key => {
    if (newObj[key] === undefined) {
      delete newObj[key];
    }
  });
  return newObj;
}
