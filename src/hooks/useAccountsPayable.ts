import { useKingdomData } from '@/contexts/KingdomContext';

export function useAccountsPayable() {
  const { payables, loading, addPayable, updatePayable, payPayable, deletePayable } = useKingdomData();

  // Auto-update overdue status on client side for display
  const today = new Date().toISOString().split('T')[0];
  const updatedPayables = payables.map(p => {
    const dueDate = p.due_date || p.dueDate || '';
    if (p.status === 'pendente' && dueDate && dueDate < today) {
      return { ...p, status: 'atrasado' as const };
    }
    return p;
  });

  return { payables: updatedPayables, loading, addPayable, updatePayable, payPayable, deletePayable };
}
