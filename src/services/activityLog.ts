/**
 * Serviço de Log de Atividades: Registra eventos e ações de usuários no sistema.
 * Responsabilidades:
 * - Salvar logs de atividades em Firestore
 * - Rastrear ações de usuários (criação, edição, exclusão, etc.)
 * - Associar logs a reinos e usuários específicos
 * - Fornecer histórico auditável das operações
 * Integração:
 * - Usa Firestore collection 'activityLogs'
 * - Timestamps automaticamente com serverTimestamp()
 * Contexto: Suporta auditoria e rastreamento do histórico do sistema.
 */
// src/services/activityLog.ts
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

export async function logActivity(
  kingdomId: string,
  userId: string,
  action: string,
  details?: Record<string, unknown>
) {
  await addDoc(collection(db, "activityLogs"), {
    kingdom_id: kingdomId,
    user_id: userId,
    action,
    details,
    created_at: serverTimestamp(),
  });
}
