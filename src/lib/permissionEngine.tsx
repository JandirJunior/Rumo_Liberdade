/**
 * 🔐 permissionEngine.ts
 * 
 * Centraliza todas as regras de permissão do sistema colaborativo (Reino)
 * 
 * ⚠️ REGRAS IMPORTANTES:
 * ❗ NÃO duplicar lógica de permissão
 * ❗ NÃO criar novos tipos de Role fora de KingdomRole
 * ❗ Sempre reutilizar essas funções
 */

import { KingdomRole } from '@/types';

// =========================
// 🎯 MATRIZ DE PERMISSÕES
// =========================

const PERMISSIONS: Record<KingdomRole, string[]> = {
  admin: [
    '*', // acesso total
  ],
  member: [
    'CREATE_TRANSACTION',
    'EDIT_TRANSACTION',
    'CREATE_ASSET'
  ],
  viewer: []
};

// =========================
// 🔍 BASE
// =========================

export function hasPermission(role: KingdomRole, permission: string): boolean {
  if (!role) return false;

  const rolePermissions = PERMISSIONS[role];

  if (!rolePermissions) return false;

  // Admin tem tudo
  if (rolePermissions.includes('*')) return true;

  return rolePermissions.includes(permission);
}

// =========================
// 💰 TRANSAÇÕES
// =========================

export function canCreateTransaction(role: KingdomRole) {
  return hasPermission(role, 'CREATE_TRANSACTION');
}

export function canEditTransaction(role: KingdomRole) {
  return hasPermission(role, 'EDIT_TRANSACTION');
}

export function canDeleteTransaction(role: KingdomRole) {
  return hasPermission(role, 'DELETE_TRANSACTION');
}

// =========================
// 📊 INVESTIMENTOS
// =========================

export function canCreateAsset(role: KingdomRole) {
  return hasPermission(role, 'CREATE_ASSET');
}

export function canEditAsset(role: KingdomRole) {
  return hasPermission(role, 'EDIT_ASSET');
}

export function canDeleteAsset(role: KingdomRole) {
  return hasPermission(role, 'DELETE_ASSET');
}

// =========================
// 🗂️ CATEGORIAS
// =========================

export function canEditCategories(role: KingdomRole) {
  return role === 'admin';
}

// =========================
// 👥 USUÁRIOS / REINO
// =========================

export function canManageUsers(role: KingdomRole) {
  return role === 'admin';
}