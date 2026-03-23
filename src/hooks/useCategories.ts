/**
 * Hook useCategories: Gerencia categorias de transações (receitas, despesas, investimentos).
 * Fornece operações CRUD para categorias, sincronização com Firestore e estado de loading.
 * Utilizado em formulários de transação, dashboards e relatórios para categorização financeira.
 * Suporta modo reino (compartilhado) e herói (individual) através do contexto KingdomContext.
 */
import { useKingdomData } from '@/contexts/KingdomContext';

export function useCategories() {
  const { categories, loading, addCategory, updateCategory, deleteCategory } = useKingdomData();

  return {
    categories,
    loading,
    addCategory,
    updateCategory,
    deleteCategory
  };
}
