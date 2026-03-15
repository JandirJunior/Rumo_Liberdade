import { useState, useEffect } from 'react';
import { db, auth } from '@/firebase';
import { collection, onSnapshot, query, where, doc, getDocs, writeBatch, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CategoryEntity } from '@/lib/financialEngine';
import { RPG_CATEGORIES_SCHEMA } from '@/lib/rpgCategories';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryEntity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setCategories([]);
        setLoading(false);
        return;
      }

      const userId = user.uid;
      const categoriesRef = collection(db, 'categories');
      const q = query(categoriesRef, where('user_id', '==', userId));

      // Check if user has categories, if not, create defaults
      const snapshot = await getDocs(q);
      const hasRpgCategories = snapshot.docs.some(doc => doc.data().rpg_group);
      const hasEnoughCategories = snapshot.docs.length >= 20;

      if (snapshot.empty || !hasRpgCategories || !hasEnoughCategories) {
        const batch = writeBatch(db);
        
        // Delete old categories if they exist
        if (!snapshot.empty) {
          snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
          });
        }
        
        // Load default categories from JSON schema
        const profileType = 'MonoUsuario'; // Defaulting to MonoUsuario for now
        
        const createCategoriesFromSchema = (
          flowType: 'income' | 'expense', 
          groupType: 'fixed' | 'variable', 
          schemaPart: any
        ) => {
          let icon = 'Target';
          let color = 'bg-gray-500';
          let rpgThemeName = schemaPart.titulo;

          if (schemaPart.titulo === '💎 Cofre do Reino (Receitas Fixas)') {
            icon = 'Castle'; color = 'bg-emerald-500'; rpgThemeName = 'Cofre do Reino';
          } else if (schemaPart.titulo === '⚡ Saques de Misssões (Receitas Variáveis)') {
            icon = 'Target'; color = 'bg-amber-500'; rpgThemeName = 'Saques de Missões';
          } else if (schemaPart.titulo === '🛡️ Tributos do Reino (Despesas Fixas)') {
            icon = 'Castle'; color = 'bg-indigo-500'; rpgThemeName = 'Tributos do Reino';
          } else if (schemaPart.titulo === '⚔️ Aventuras do Herói (Despesas Variáveis)') {
            icon = 'Compass'; color = 'bg-rose-500'; rpgThemeName = 'Aventuras do Herói';
          }

          schemaPart.subcategorias.forEach((sub: any) => {
            const newDocRef = doc(collection(db, 'categories'));
            const cat: Omit<CategoryEntity, 'id' | 'user_id' | 'created_at'> = {
              name: sub.nome,
              flow_type: flowType,
              group_type: groupType,
              rpg_group: schemaPart.titulo,
              allowed_profiles: sub.usuarios || ['MonoUsuario', 'MultiUsuario'],
              icon,
              color,
              rpg_theme_name: rpgThemeName
            };
            
            batch.set(newDocRef, {
              ...cat,
              id: newDocRef.id,
              user_id: userId,
              created_at: new Date()
            });
          });
        };

        const schema = RPG_CATEGORIES_SCHEMA.financeiroRPG;
        createCategoriesFromSchema('income', 'fixed', schema.receitas.fixas);
        createCategoriesFromSchema('income', 'variable', schema.receitas.variaveis);
        createCategoriesFromSchema('expense', 'fixed', schema.despesas.fixas);
        createCategoriesFromSchema('expense', 'variable', schema.despesas.variaveis);

        await batch.commit();
      }

      // Listen to categories
      const unsubscribeCategories = onSnapshot(q, (snapshot) => {
        const loadedCategories = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            ...data,
            id: doc.id,
            created_at: data.created_at?.toDate() || new Date()
          } as CategoryEntity;
        });
        setCategories(loadedCategories);
        setLoading(false);
      });

      return () => unsubscribeCategories();
    });

    return () => unsubscribeAuth();
  }, []);

  const addCategory = async (category: Omit<CategoryEntity, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!auth.currentUser) return;
    const newId = doc(collection(db, 'categories')).id;
    const newCategory = {
      ...category,
      id: newId,
      user_id: auth.currentUser.uid,
      created_at: new Date()
    };
    await setDoc(doc(db, 'categories', newId), newCategory);
  };

  const updateCategory = async (id: string, category: Partial<CategoryEntity>) => {
    if (!auth.currentUser) return;
    await updateDoc(doc(db, 'categories', id), {
      ...category,
      updated_at: new Date()
    });
  };

  const deleteCategory = async (id: string) => {
    if (!auth.currentUser) return;
    await deleteDoc(doc(db, 'categories', id));
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}
