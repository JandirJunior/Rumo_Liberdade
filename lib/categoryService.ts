import { collection, doc, getDocs, query, where, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';

export interface CategoryGroup {
  id: string;
  name: string;
  type: 'income' | 'expense' | 'investment';
  nature: 'fixed' | 'variable';
}

export const FIXED_CATEGORY_GROUPS: CategoryGroup[] = [
  { id: 'income_fixed', name: '💎 Cofre do Reino', type: 'income', nature: 'fixed' },
  { id: 'income_variable', name: '⚡ Saques de Missões', type: 'income', nature: 'variable' },
  { id: 'expense_fixed', name: '🛡️ Tributos do Reino', type: 'expense', nature: 'fixed' },
  { id: 'expense_variable', name: '⚔️ Aventuras do Herói', type: 'expense', nature: 'variable' }
];

export interface CategoryEntity {
  id: string;
  kingdom_id: string;
  name: string;
  group_id: string; // Relates to category_groups
  created_at: Date;
  is_active: boolean;
  // Legacy fields for backward compatibility
  user_id?: string;
  group_type?: 'fixed' | 'variable';
  flow_type?: 'income' | 'expense';
  rpg_group?: string;
  allowed_profiles?: ('MonoUsuario' | 'MultiUsuario')[];
  icon?: string;
  color?: string;
  rpg_theme_name?: string;
  created_by?: string;
}

export const categoryService = {
  async getCategoryGroups(): Promise<CategoryGroup[]> {
    return FIXED_CATEGORY_GROUPS;
  },

  async getCategoriesByKingdom(kingdomId: string): Promise<CategoryEntity[]> {
    const q = query(collection(db, 'categories'), where('kingdom_id', '==', kingdomId));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        kingdom_id: data.kingdom_id,
        name: data.name,
        group_id: data.group_id,
        created_at: data.created_at?.toDate() || new Date(),
        is_active: data.is_active ?? true,
        user_id: data.user_id,
        group_type: data.group_type,
        flow_type: data.flow_type,
        rpg_group: data.rpg_group,
        allowed_profiles: data.allowed_profiles,
        icon: data.icon,
        color: data.color,
        rpg_theme_name: data.rpg_theme_name,
        created_by: data.created_by
      } as CategoryEntity;
    });
  },

  async createCategory(category: Omit<CategoryEntity, 'id' | 'created_at'>): Promise<string> {
    const docRef = await addDoc(collection(db, 'categories'), {
      ...category,
      created_at: new Date()
    });
    return docRef.id;
  },

  async updateCategory(id: string, updates: Partial<CategoryEntity>): Promise<void> {
    const docRef = doc(db, 'categories', id);
    await updateDoc(docRef, updates);
  },

  async deleteCategory(id: string): Promise<void> {
    const docRef = doc(db, 'categories', id);
    await deleteDoc(docRef);
  },

  /**
   * Normaliza a categoria de uma transação para garantir que use apenas category_id
   * e mantenha compatibilidade com sistemas legados se necessário.
   */
  normalizeTransactionCategory(transaction: any) {
    // Garante que category_id existe
    if (!transaction.category_id && transaction.category) {
      transaction.category_id = transaction.category;
    }
    
    // Remove o campo 'category' se existir para seguir a regra de "apenas category_id"
    // Mas podemos manter um category_name para exibição se for útil no frontend
    return transaction;
  }
};
