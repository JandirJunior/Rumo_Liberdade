/**
 * 🧠 useCategories.ts
 * -------------------------------------------------------
 * Hook responsável por gerenciar as categorias financeiras
 * do sistema RPG (Rumo à Liberdade).
 *
 * ✅ RESPONSABILIDADES:
 * - Buscar categorias do Firestore por kingdom_id
 * - Escutar alterações em tempo real (onSnapshot)
 * - Permitir CRUD de categorias (com controle de permissão)
 * - Integrar com sistema de auditoria (logActivity)
 *
 * ❌ IMPORTANTE (CORREÇÃO CRÍTICA APLICADA):
 * - REMOVIDA lógica de criação automática de categorias dentro do hook
 * - REMOVIDO uso de writeBatch com deleção em massa
 * - REMOVIDA dependência de validações frágeis (hasEnoughCategories, etc.)
 *
 * 🚨 MOTIVO:
 * Essa lógica estava recriando e deletando categorias automaticamente,
 * causando:
 * - duplicidade de categorias
 * - quebra de category_id nas transações
 * - inconsistência no orçamento (orçado vs realizado)
 *
 * ✅ NOVA REGRA:
 * - O hook apenas LÊ dados
 * - A criação de categorias padrão deve ser feita via:
 *   👉 lib/categorySeed.ts (executado UMA única vez no login/criação do reino)
 *
 * ⚠️ REGRAS IMPORTANTES DO PROJETO:
 * - Não duplicar lógica financeira
 * - Não alterar o motor financeiro drasticamente
 * - Não remover funcionalidades existentes
 * - Reutilizar módulos existentes
 * - Manter compatibilidade com Firestore
 */

import { useState, useEffect } from 'react';
import { db, auth } from '@/services/firebase';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';

import { CategoryEntity } from '@/types';
import { useKingdom } from './useKingdom';
import {
  getCollectionByKingdom,
  handleFirestoreError,
  OperationType
} from '@/services/firebaseUtils';

import { canEditCategories } from '@/lib/permissionEngine';
import { logActivity } from '@/lib/auditLogger';

export function useCategories() {
  const [categories, setCategories] = useState<CategoryEntity[]>([]);
  const [loading, setLoading] = useState(true);

  const { kingdom, role, loading: kingdomLoading } = useKingdom();

  useEffect(() => {
    // ⛔ Aguarda carregamento do reino
    if (kingdomLoading) return;

    // ⛔ Sem usuário ou reino → limpa estado
    if (!kingdom || !auth.currentUser) {
      const timer = setTimeout(() => {
        setCategories([]);
        setLoading(false);
      }, 0);
      return () => clearTimeout(timer);
    }

    /**
     * 🔍 Query baseada no kingdom_id
     * Isso garante isolamento de dados por REINO (multiusuário)
     */
    const q = getCollectionByKingdom('categories', kingdom.id);

    /**
     * 🔄 Listener em tempo real
     * Sempre que houver alteração no Firestore, atualiza automaticamente
     */
    const unsubscribeCategories = onSnapshot(
      q,
      (snapshot) => {
        const loadedCategories = snapshot.docs.map((doc) => {
          const data = doc.data();

          return {
            ...data,
            id: doc.id,
            created_at: data.created_at?.toDate?.() || new Date()
          } as CategoryEntity;
        });

        setCategories(loadedCategories);
        setLoading(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'categories');
      }
    );

    // 🧹 Cleanup do listener ao desmontar componente
    return () => {
      unsubscribeCategories();
    };
  }, [kingdom, kingdomLoading]);

  /**
   * ➕ Criar nova categoria
   */
  const addCategory = async (
    category: Omit<CategoryEntity, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
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

    // 🧾 Log de auditoria
    await logActivity(
      kingdom.id,
      auth.currentUser.uid,
      'CREATE_CATEGORY',
      newId,
      { name: category.name }
    );
  };

  /**
   * ✏️ Atualizar categoria
   */
  const updateCategory = async (
    id: string,
    category: Partial<CategoryEntity>
  ) => {
    if (!auth.currentUser || !kingdom || !role) return;

    if (!canEditCategories(role)) {
      throw new Error('Sem permissão para editar categorias.');
    }

    await updateDoc(doc(db, 'categories', id), {
      ...category,
      updated_at: new Date()
    });
  };

  /**
   * 🗑️ Remover categoria
   */
  const deleteCategory = async (id: string) => {
    if (!auth.currentUser || !kingdom || !role) return;

    if (!canEditCategories(role)) {
      throw new Error('Sem permissão para deletar categorias.');
    }

    await deleteDoc(doc(db, 'categories', id));

    // 🧾 Log de auditoria
    await logActivity(
      kingdom.id,
      auth.currentUser.uid,
      'DELETE_CATEGORY',
      id
    );
  };

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory
  };
}