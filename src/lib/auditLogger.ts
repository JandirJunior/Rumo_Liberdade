/**
 * Logger de Auditoria: Sistema centralizado para registro de atividades do sistema.
 * Responsabilidades:
 * - Registrar todas as operações importantes (criação, edição, exclusão)
 * - Associar ações a usuários e reinos específicos
 * - Fornecer rastreamento completo para auditoria e debugging
 * - Usar Firestore para persistência com timestamps automáticos
 * Integração:
 * - Chamado por serviços (kingdomService, userService, etc.)
 * - Usa collection 'activityLogs' no Firestore
 * Contexto: Essencial para compliance, debugging e análise de uso do sistema.
 */
import { db } from '@/services/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';

export async function logActivity(
  kingdomId: string,
  userId: string,
  action: string,
  entityId?: string,
  details?: any
) {
  const id = doc(collection(db, 'activity_logs')).id;

  await setDoc(doc(db, 'activity_logs', id), {
    id,
    kingdom_id: kingdomId,
    user_id: userId,
    action,
    entity_id: entityId || null,
    details: details || null,
    created_at: new Date()
  });
}