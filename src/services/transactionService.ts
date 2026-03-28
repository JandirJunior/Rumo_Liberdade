import { db } from '@/services/firebase';
import { collection, doc, runTransaction, Timestamp } from 'firebase/firestore';
import { permissionService } from './permissionService';
import { financialConsistencyService } from './financialConsistencyService';
import { Transaction } from '@/types';

export interface CreateTransactionRequest {
  userId: string;
  kingdom_id: string;
  transactionData: Partial<Transaction>;
  idempotencyKey: string;
}

export const transactionService = {
  /**
   * Cria uma transação com controle de concorrência e idempotência.
   */
  async createTransaction({ userId, kingdom_id, transactionData, idempotencyKey }: CreateTransactionRequest) {
    // 1. Verificar permissões
    const canCreate = await permissionService.canUserPerformAction({
      userId,
      kingdom_id,
      action: 'create_transaction'
    });

    if (!canCreate) {
      throw new Error('Permissão negada para criar transação.');
    }

    try {
      // 2. Transação do Firestore para garantir idempotência e concorrência
      const result = await runTransaction(db, async (transaction) => {
        // Verificar idempotência
        const idempotencyRef = doc(db, 'idempotency_keys', idempotencyKey);
        const idempotencyDoc = await transaction.get(idempotencyRef);

        if (idempotencyDoc.exists()) {
          // Já processado
          return { success: true, message: 'Transação já processada (idempotência).', id: idempotencyDoc.data().transactionId };
        }

        // Criar a transação
        const newTransactionRef = doc(collection(db, 'transactions'));
        const newTransactionData = {
          ...transactionData,
          kingdom_id,
          created_by: userId,
          created_at: Timestamp.now(),
          updated_at: Timestamp.now()
        };

        transaction.set(newTransactionRef, newTransactionData);

        // Registrar chave de idempotência
        transaction.set(idempotencyRef, {
          transactionId: newTransactionRef.id,
          created_at: Timestamp.now(),
          kingdom_id
        });

        return { success: true, message: 'Transação criada com sucesso.', id: newTransactionRef.id };
      });

      // 3. Garantir consistência financeira assincronamente
      // Não bloqueia a resposta, mas atualiza os totais do reino
      financialConsistencyService.assertFinancialConsistency(kingdom_id).catch(err => {
        console.error('Erro na consistência financeira após transação:', err);
      });

      return result;
    } catch (error) {
      console.error('Erro ao criar transação:', error);
      throw error;
    }
  }
};
