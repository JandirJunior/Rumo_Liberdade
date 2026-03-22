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
