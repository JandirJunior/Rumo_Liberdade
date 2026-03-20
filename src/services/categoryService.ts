import { collection, doc, getDocs, query, where, addDoc, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '@/services/firebase';
import { CategoryEntity } from '@/types';

export const categoryService = {
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
        flow_type: data.flow_type,
      } as CategoryEntity;
    });
  },

  async getCategoryById(categoryId: string): Promise<CategoryEntity | null> {
    const docRef = doc(db, 'categories', categoryId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      ...data,
      created_at: data.created_at?.toDate() || new Date(),
    } as CategoryEntity;
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
  }
};
