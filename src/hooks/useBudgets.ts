import { useKingdomData } from '@/contexts/KingdomContext';

export function useBudgets(month: number, year: number) {
  const { budgets, loading, saveBudget, getBudgetProgress } = useKingdomData();
  
  const budgetProgress = getBudgetProgress(month, year);

  return { budgets, budgetProgress, loading, saveBudget };
}
