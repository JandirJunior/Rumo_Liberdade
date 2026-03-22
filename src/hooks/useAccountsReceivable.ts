import { useKingdomData } from '@/contexts/KingdomContext';

export function useAccountsReceivable() {
  const { receivables, loading, addReceivable, updateReceivable, receiveReceivable, deleteReceivable } = useKingdomData();

  return { receivables, loading, addReceivable, updateReceivable, receiveReceivable, deleteReceivable };
}
