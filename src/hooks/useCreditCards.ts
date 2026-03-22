import { useKingdomData } from '@/contexts/KingdomContext';

export function useCreditCards() {
  const { creditCards, loading, addCreditCard, updateCreditCard, deleteCreditCard } = useKingdomData();
  return { creditCards, loading, addCreditCard, updateCreditCard, deleteCreditCard };
}
