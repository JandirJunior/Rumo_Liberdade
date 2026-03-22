import { useKingdomData } from '@/contexts/KingdomContext';

export function useCreditCardInvoices() {
  const { creditCardInvoices, loading, addCreditCardInvoice, updateCreditCardInvoice, payCreditCardInvoice, deleteCreditCardInvoice } = useKingdomData();

  // Auto-update overdue status on client side for display
  const today = new Date().toISOString().split('T')[0];
  const updatedInvoices = creditCardInvoices.map(i => {
    if (i.status === 'open' && i.dueDate && i.dueDate < today) {
      return { ...i, status: 'overdue' as const };
    }
    return i;
  });

  return { 
    invoices: updatedInvoices, 
    loading, 
    addInvoice: addCreditCardInvoice, 
    updateInvoice: updateCreditCardInvoice, 
    payInvoice: payCreditCardInvoice, 
    deleteInvoice: deleteCreditCardInvoice 
  };
}
