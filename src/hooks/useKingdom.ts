/**
 * 🏰 useKingdom - CORE CENTRAL DO SISTEMA
 *
 * RESPONSABILIDADES:
 * - Gerenciar Reino (multiusuário)
 * - Sincronizar dados com Firestore
 * - Centralizar transações e investimentos
 * - Integrar gamificação (XP)
 *
 * REGRAS:
 * ❗ Não duplicar cálculos financeiros
 * ❗ Sempre usar category_id
 * ❗ Não misturar lógica de UI aqui
 */

import { useKingdom } from '@/contexts/KingdomContext';

export { useKingdom };

// 👥 LISTAR MEMBROS DO REINO
export function useKingdomMembers() {
  const { members, loading } = useKingdom();
  return { members, loading };
}

export function useUserInvites() {
  const { userInvites, loading } = useKingdom();
  return { invites: userInvites, loading };
}

export function useKingdomInvites() {
  const { kingdomInvites } = useKingdom();
  return { invites: kingdomInvites };
}
