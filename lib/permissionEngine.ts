export type KingdomRole = 'admin' | 'member' | 'viewer';

export const PERMISSIONS = {
  CREATE_TRANSACTION: ['admin', 'member'],
  EDIT_TRANSACTION: ['admin', 'member'],
  DELETE_TRANSACTION: ['admin'],
  CREATE_PAYABLE: ['admin', 'member'],
  EDIT_PAYABLE: ['admin', 'member'],
  DELETE_PAYABLE: ['admin'],
  CREATE_RECEIVABLE: ['admin', 'member'],
  EDIT_RECEIVABLE: ['admin', 'member'],
  DELETE_RECEIVABLE: ['admin'],
  CREATE_ASSET: ['admin', 'member'],
  EDIT_ASSET: ['admin', 'member'],
  DELETE_ASSET: ['admin'],
  MANAGE_USERS: ['admin'],
  EDIT_KINGDOM: ['admin'],
  VIEW_ALL: ['admin', 'member', 'viewer'],
};

export function hasPermission(role: KingdomRole | undefined | null, action: keyof typeof PERMISSIONS): boolean {
  if (!role) return false;
  return PERMISSIONS[action].includes(role);
}

export function canCreateTransaction(role: KingdomRole | undefined | null) {
  return role === 'admin' || role === 'member';
}

export function canManageUsers(role: KingdomRole | undefined | null) {
  return role === 'admin';
}

export function canEditCategories(role: KingdomRole | undefined | null) {
  return role === 'admin';
}

export function canDeleteTransaction(role: KingdomRole | undefined | null) {
  return role === 'admin';
}

export function canEditTransaction(role: KingdomRole | undefined | null) {
  return role === 'admin' || role === 'member';
}

export function canEditKingdom(role: KingdomRole | undefined | null) {
  return role === 'admin';
}
