import { db } from '@/services/firebase';
import { collection, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { permissionService } from './permissionService';
import { financialConsistencyService } from './financialConsistencyService';
import { Asset } from '@/types';

export interface CreateInvestmentRequest {
  userId: string;
  kingdom_id: string;
  investmentData: Partial<Asset>;
  idempotencyKey: string;
}

export const investmentService = {
  /**
   * Cria um investimento com controle de concorrência e idempotência.
   */
  async createInvestment({ userId, kingdom_id, investmentData, idempotencyKey }: CreateInvestmentRequest) {
    // 1. Verificar permissões
    const canCreate = await permissionService.canUserPerformAction({
      userId,
      kingdom_id,
      action: 'create_investment'
    });

    if (!canCreate) {
      throw new Error('Permissão negada para criar investimento.');
    }

    try {
      // 2. Transação do Firestore para garantir idempotência e concorrência
      const result = await runTransaction(db, async (transaction) => {
        // Verificar idempotência
        const idempotencyRef = doc(db, 'idempotency_keys', idempotencyKey);
        const idempotencyDoc = await transaction.get(idempotencyRef);

        if (idempotencyDoc.exists()) {
          // Já processado
          return { success: true, message: 'Investimento já processado (idempotência).', id: idempotencyDoc.data().investmentId };
        }

        // Criar o investimento
        const newInvestmentRef = doc(collection(db, 'investments'));
        const newInvestmentData = {
          ...investmentData,
          kingdom_id,
          created_by: userId,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now()
        };

        transaction.set(newInvestmentRef, newInvestmentData);

        // Registrar chave de idempotência
        transaction.set(idempotencyRef, {
          investmentId: newInvestmentRef.id,
          created_at: Timestamp.now(),
          kingdom_id
        });

        return { success: true, message: 'Investimento criado com sucesso.', id: newInvestmentRef.id };
      });

      // 3. Garantir consistência financeira assincronamente
      // Não bloqueia a resposta, mas atualiza os totais do reino
      financialConsistencyService.assertFinancialConsistency(kingdom_id).catch(err => {
        console.error('Erro na consistência financeira após investimento:', err);
      });

      return result;
    } catch (error) {
      console.error('Erro ao criar investimento:', error);
      throw error;
    }
  }
};
