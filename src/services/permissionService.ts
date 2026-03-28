import { db } from '@/services/firebase';
import { doc, getDoc } from 'firebase/firestore';

export type ActionType = 'create_transaction' | 'edit_transaction' | 'delete_transaction' | 'create_investment' | 'edit_investment' | 'delete_investment' | 'manage_categories' | 'manage_users';

export interface PermissionRequest {
  userId: string;
  kingdom_id: string;
  action: ActionType;
}

export const permissionService = {
  /**
   * Verifica se o usuário tem permissão para realizar uma ação no reino.
   */
  async canUserPerformAction({ userId, kingdom_id, action }: PermissionRequest): Promise<boolean> {
    if (!userId || !kingdom_id) return false;

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) return false;

      const userData = userSnap.data();
      
      // Se não pertence ao reino, não pode fazer nada
      if (userData.kingdom_id !== kingdom_id) return false;

      const role = userData.role || 'viewer';

      // Admin pode tudo
      if (role === 'admin') return true;

      // Member pode criar/editar/deletar transações e investimentos
      if (role === 'member') {
        const memberActions: ActionType[] = [
          'create_transaction', 'edit_transaction', 'delete_transaction',
          'create_investment', 'edit_investment', 'delete_investment'
        ];
        return memberActions.includes(action);
      }

      // Viewer não pode fazer nada que modifique dados
      return false;
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      return false;
    }
  }
};
