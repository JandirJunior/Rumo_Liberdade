import { useState, useEffect } from 'react';
import { db, auth } from '@/services/firebase';
import { collection, onSnapshot, query, where, doc, getDocs, writeBatch, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { CategoryEntity } from '@/types';
import { RPG_CATEGORIES_SCHEMA } from '@/lib/rpgCategories';
import { useKingdom } from './useKingdom';
import { getCollectionByKingdom, handleFirestoreError, OperationType } from '@/services/firebaseUtils';
import { canEditCategories } from '@/lib/permissionEngine';
import { logActivity } from '@/lib/auditLogger';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryEntity[]>([]);
  const [loading, setLoading] = useState(true);
  const { kingdom, role, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    if (kingdomLoading) return;

    if (!kingdom || !auth.currentUser) {
      setCategories([]);
      setLoading(false);
      return;
    }

    const userId = auth.currentUser.uid;
    const q = getCollectionByKingdom('categories', kingdom.id);

    let isCreatingDefaults = false;

    // Check if kingdom has categories, if not, create defaults
    const checkAndCreateDefaults = async () => {
      if (isCreatingDefaults) return;
      isCreatingDefaults = true;
      try {
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
            } else if (schemaPart.titulo === '⚡ Saque de Missões (Receitas Variáveis)') {
              icon = 'Target'; color = 'bg-amber-500'; rpgThemeName = 'Saque de Missões';
            } else if (schemaPart.titulo === '🛡️ Tributos do Reino (Despesas Fixas)') {
              icon = 'Castle'; color = 'bg-indigo-500'; rpgThemeName = 'Tributos do Reino';
            } else if (schemaPart.titulo === '⚔️ Aventuras do Herói (Despesas Variáveis)') {
              icon = 'Compass'; color = 'bg-rose-500'; rpgThemeName = 'Aventuras do Herói';
            }

            schemaPart.subcategorias.forEach((sub: any) => {
              const newDocRef = doc(collection(db, 'categories'));
              const groupId = `${flowType}_${groupType}`;
              const cat: Omit<CategoryEntity, 'id' | 'user_id' | 'created_at'> = {
                name: sub.nome,
                group_id: groupId,
                is_active: true,
                flow_type: flowType,
                group_type: groupType,
                rpg_group: schemaPart.titulo,
                allowed_profiles: sub.usuarios || ['MonoUsuario', 'MultiUsuario'],
                icon,
                color,
                rpg_theme_name: rpgThemeName,
                kingdom_id: kingdom.id,
                created_by: userId
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
      } finally {
        isCreatingDefaults = false;
      }
    };

    checkAndCreateDefaults();

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
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'categories');
    });

    return () => {
      unsubscribeCategories();
    };
  }, [kingdom, kingdomLoading]);

  const addCategory = async (category: Omit<CategoryEntity, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditCategories(role)) {
      throw new Error('Sem permissão para criar categorias.');
    }

    const newId = doc(collection(db, 'categories')).id;
    const newCategory = {
      ...category,
      group_id: category.group_id || `${category.flow_type}_${category.group_type}`,
      is_active: category.is_active ?? true,
      id: newId,
      user_id: auth.currentUser.uid,
      created_at: new Date(),
      kingdom_id: kingdom.id,
      created_by: auth.currentUser.uid
    };
    await setDoc(doc(db, 'categories', newId), newCategory);
    await logActivity(kingdom.id, auth.currentUser.uid, 'CREATE_CATEGORY', newId, { name: category.name });
  };

  const updateCategory = async (id: string, category: Partial<CategoryEntity>) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditCategories(role)) {
      throw new Error('Sem permissão para editar categorias.');
    }

    await updateDoc(doc(db, 'categories', id), {
      ...category,
      updated_at: new Date()
    });
  };

  const deleteCategory = async (id: string) => {
    if (!auth.currentUser || !kingdom || !role) return;
    if (!canEditCategories(role)) {
      throw new Error('Sem permissão para deletar categorias.');
    }

    await deleteDoc(doc(db, 'categories', id));
    await logActivity(kingdom.id, auth.currentUser.uid, 'DELETE_CATEGORY', id);
  };

  return { categories, loading, addCategory, updateCategory, deleteCategory };
}
