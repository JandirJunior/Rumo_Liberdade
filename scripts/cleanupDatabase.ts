/**
 * 🧹 cleanupDatabase.ts
 * -------------------------------------------------------
 * Script para limpar inconsistências do Firestore:
 * - categorias duplicadas
 * - categorias inválidas
 * - transações sem category_id
 *
 * ⚠️ EXECUTAR MANUALMENTE (NÃO AUTOMÁTICO)
 */

import { db } from '@/services/firebase';
import {
  collection,
  getDocs,
  deleteDoc,
  doc,
  writeBatch
} from 'firebase/firestore';

export async function cleanupDatabase(kingdomId: string) {
  console.log('🧹 Iniciando limpeza do banco...');

  // =========================
  // 1. LIMPAR CATEGORIAS DUPLICADAS
  // =========================
  const categoriesSnapshot = await getDocs(collection(db, 'categories'));

  const seen = new Map<string, string>(); // chave = nome+grupo

  for (const c of categoriesSnapshot.docs) {
    const data = c.data();

    if (data.kingdom_id !== kingdomId) continue;

    const key = `${data.name}_${data.group_id}`;

    if (seen.has(key)) {
      console.log(`❌ Deletando duplicada: ${data.name}`);
      await deleteDoc(doc(db, 'categories', c.id));
    } else {
      seen.set(key, c.id);
    }
  }

  // =========================
  // 2. CORRIGIR TRANSAÇÕES SEM CATEGORY_ID
  // =========================
  const transactionsSnapshot = await getDocs(collection(db, 'transactions'));

  const batch = writeBatch(db);

  transactionsSnapshot.docs.forEach((t) => {
    const data = t.data();

    if (data.kingdom_id !== kingdomId) return;

    if (!data.category_id) {
      console.log(`⚠️ Corrigindo transação ${t.id}`);

      batch.update(doc(db, 'transactions', t.id), {
        category_id: 'uncategorized'
      });
    }
  });

  await batch.commit();

  console.log('✅ Limpeza concluída!');
}