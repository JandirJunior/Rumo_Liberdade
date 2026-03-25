import { useKingdomData } from '@/contexts/KingdomContext';

export function useBudgets(month: number, year: number) {
  const { budgets, loading, saveBudget: contextSaveBudget, getBudgetProgress } = useKingdomData();
  
  const budgetProgress = getBudgetProgress(month, year);

  const saveBudget = (category_id: string, amount: number, targetMonth?: number, targetYear?: number) => {
    return contextSaveBudget(category_id, amount, targetMonth || month, targetYear || year);
  };

  return { budgets, budgetProgress, loading, saveBudget };
}
