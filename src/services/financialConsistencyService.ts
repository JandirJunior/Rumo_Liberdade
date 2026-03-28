import { db } from '@/services/firebase';
import { collection, query, where, getDocs, doc, updateDoc, writeBatch } from 'firebase/firestore';

export const financialConsistencyService = {
  /**
   * Recalcula o patrimônio e saldos do reino para garantir consistência.
   */
  async assertFinancialConsistency(kingdom_id: string): Promise<boolean> {
    if (!kingdom_id) return false;

    try {
      // 1. Buscar todas as transações do reino
      const transactionsRef = collection(db, 'transactions');
      const qTransactions = query(transactionsRef, where('kingdom_id', '==', kingdom_id));
      const transactionsSnap = await getDocs(qTransactions);

      let currentBalance = 0;

      transactionsSnap.forEach(docSnap => {
        const data = docSnap.data();
        const amount = Number(data.amount || 0);
        if (data.type === 'income' || data.type === 'earning') {
          currentBalance += amount;
        } else if (data.type === 'expense') {
          currentBalance -= amount;
        } else if (data.type === 'investment') {
          currentBalance += amount; // Investment: Buy is negative, Sale is positive
        }
      });

      // 2. Buscar todos os investimentos do reino
      const investmentsRef = collection(db, 'investments');
      const qInvestments = query(investmentsRef, where('kingdom_id', '==', kingdom_id));
      const investmentsSnap = await getDocs(qInvestments);

      let totalInvested = 0;

      investmentsSnap.forEach(docSnap => {
        const data = docSnap.data();
        if (data.invested_value) {
          totalInvested += data.invested_value;
        } else if (data.quantity && data.price) {
          totalInvested += data.quantity * data.price;
        }
      });

      // 3. Atualizar o reino
      const kingdomRef = doc(db, 'kingdoms', kingdom_id);
      await updateDoc(kingdomRef, {
        balance: currentBalance,
        investments_total: totalInvested,
        net_worth: currentBalance + totalInvested,
        last_consistency_check: new Date().toISOString()
      });

      return true;
    } catch (error) {
      console.error(`Erro ao garantir consistência financeira do reino ${kingdom_id}:`, error);
      return false;
    }
  }
};
