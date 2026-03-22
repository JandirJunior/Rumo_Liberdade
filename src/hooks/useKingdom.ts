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

import { useKingdomData } from '@/contexts/KingdomContext';

export function useKingdom() {
  return useKingdomData();
}

// 👥 LISTAR MEMBROS DO REINO
export function useKingdomMembers() {
  const { members, loading } = useKingdomData();
  return { members, loading };
}

export function useUserInvites() {
  const { userInvites, loading } = useKingdomData();
  return { invites: userInvites, loading };
}

export function useKingdomInvites() {
  const { kingdomInvites } = useKingdomData();
  return { invites: kingdomInvites };
}
