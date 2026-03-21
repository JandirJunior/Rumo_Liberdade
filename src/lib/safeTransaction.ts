/**
 * 🔒 safeTransaction.ts
 * -------------------------------------------------------
 * Garante que TODA transação é válida
 */

export function validateTransaction(data: any) {
  if (!data.category_id) {
    throw new Error('Transação sem categoria_id');
  }

  if (!data.amount || isNaN(data.amount)) {
    throw new Error('Valor inválido');
  }

  if (!data.type) {
    throw new Error('Tipo obrigatório');
  }

  return true;
}