/**
 * 🔍 systemValidator.ts
 * -------------------------------------------------------
 * Valida integridade do sistema financeiro
 */

import { db } from '@/services/firebase';
import { collection, getDocs } from 'firebase/firestore';

export async function validateSystem(kingdomId: string) {
  const errors: string[] = [];

  const categories = await getDocs(collection(db, 'categories'));
  const transactions = await getDocs(collection(db, 'transactions'));

  const categoryIds = new Set<string>();

  categories.docs.forEach((c) => {
    const data = c.data();
    if (data.kingdom_id === kingdomId) {
      categoryIds.add(c.id);
    }
  });

  transactions.docs.forEach((t) => {
    const data = t.data();

    if (data.kingdom_id !== kingdomId) return;

    if (!data.category_id) {
      errors.push(`Transação ${t.id} sem categoria`);
    }

    if (!categoryIds.has(data.category_id)) {
      errors.push(`Transação ${t.id} com categoria inválida`);
    }
  });

  return errors;
}