import { useKingdomData } from '@/contexts/KingdomContext';

export function useBudgets(month: number, year: number) {
  const { budgets, loading, saveBudget: contextSaveBudget, getBudgetProgress } = useKingdomData();
  
  const budgetProgress = getBudgetProgress(month, year);

  const saveBudget = (category_id: string, amount: number) => {
    return contextSaveBudget(category_id, amount, month, year);
  };

  return { budgets, budgetProgress, loading, saveBudget };
}
