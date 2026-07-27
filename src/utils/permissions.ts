import { UserRole } from '../types';

// Define permission configuration with scope restrictions
export interface PermissionConfig {
  scope?: 'station' | 'region' | 'global';
  maxAmount?: number;
}

// Define all available permissions
export type Permission = 
  | 'stations:read' | 'stations:view' | 'stations:create' | 'stations:update' | 'stations:delete' | 'stations:*'
  | 'sales:read' | 'sales:create' | 'sales:update' | 'sales:delete' | 'sales:reconcile' | 'sales:export' | 'sales:*'
  | 'pumps:read' | 'pumps:create' | 'pumps:update' | 'pumps:delete' | 'pumps:record' | 'pumps:*'
  | 'inventory:read' | 'inventory:create' | 'inventory:update' | 'inventory:delete' | 'inventory:*'
  | 'expenses:read' | 'expenses:create' | 'expenses:update' | 'expenses:delete' | 'expenses:approve' | 'expenses:manage' | 'expenses:*'
  | 'users:read' | 'users:create' | 'users:update' | 'users:delete' | 'users:manage' | 'users:view' | 'users:*'
  | 'reports:read' | 'reports:generate' | 'reports:export' | 'reports:*'
  | 'purchases:read' | 'purchases:create' | 'purchases:update' | 'purchases:delete' | 'purchases:approve' | 'purchases:*'
  | 'logistics:read' | 'logistics:create' | 'logistics:update' | 'logistics:delete' | 'logistics:*'
  | 'employees:read' | 'employees:create' | 'employees:update' | 'employees:delete' | 'employees:*'
  | 'analytics:read' | 'analytics:*'
  | 'settings:read' | 'settings:update' | 'settings:*'
  | 'support:read' | 'support:create' | 'support:update' | 'support:delete' | 'support:*'
  | 'notifications:read' | 'notifications:create' | 'notifications:update' | 'notifications:delete' | 'notifications:*'
  | 'regions:read' | 'regions:create' | 'regions:update' | 'regions:delete' | 'regions:*';

// Define permissions as objects with configs - ONLY use roles from Prisma schema
export const PERMISSIONS: Record<UserRole, Record<string, PermissionConfig | true>> = {
  [UserRole.SUPER_ADMIN]: {
    'stations:*': { scope: 'global' },
    'sales:*': { scope: 'global' },
    'pumps:*': { scope: 'global' },
    'inventory:*': { scope: 'global' },
    'expenses:*': { scope: 'global' },
    'users:*': { scope: 'global' },
    'reports:*': { scope: 'global' },
    'purchases:*': { scope: 'global' },
    'logistics:*': { scope: 'global' },
    'employees:*': { scope: 'global' },
    'analytics:*': { scope: 'global' },
    'settings:*': { scope: 'global' },
    'support:*': { scope: 'global' },
    'notifications:*': { scope: 'global' },
    'regions:*': { scope: 'global' },
  },

  [UserRole.REGIONAL_MANAGER]: {
    'stations:read': { scope: 'region' },
    'stations:view': { scope: 'region' },
    'sales:read': { scope: 'region' },
    'sales:export': { scope: 'region' },
    'pumps:read': { scope: 'region' },
    'inventory:read': { scope: 'region' },
    'expenses:read': { scope: 'region' },
    'expenses:approve': { scope: 'region', maxAmount: 1000000 },
    'reports:generate': { scope: 'region' },
    'reports:export': { scope: 'region' },
    'users:read': { scope: 'region' },
    'analytics:read': { scope: 'region' },
    'logistics:read': { scope: 'region' },
  },

  [UserRole.SUPERVISOR]: {
    'stations:read': { scope: 'station' },
    'sales:read': { scope: 'station' },
    'sales:create': { scope: 'station' },
    'sales:reconcile': { scope: 'station' },
    'sales:export': { scope: 'station' },
    'pumps:read': { scope: 'station' },
    'pumps:update': { scope: 'station' },
    'pumps:record': { scope: 'station' },
    'inventory:read': { scope: 'station' },
    'expenses:create': { scope: 'station', maxAmount: 50000 },
    'expenses:read': { scope: 'station' },
    'expenses:manage': { scope: 'station', maxAmount: 100000 },
    'reports:generate': { scope: 'station' },
    'users:view': { scope: 'station' },
    'employees:read': { scope: 'station' },
    'logistics:read': { scope: 'station' },
    'analytics:read': { scope: 'station' },
  },

  [UserRole.ATTENDANT]: {
    'sales:create': { scope: 'station' },
    'sales:read': { scope: 'station' },
    'pumps:read': { scope: 'station' },
    'pumps:record': { scope: 'station' },
  },

  [UserRole.ACCOUNTANT]: {
    'sales:read': { scope: 'global' },
    'sales:export': { scope: 'global' },
    'expenses:*': { scope: 'global' },
    'expenses:read': { scope: 'global' },
    'expenses:approve': { scope: 'global', maxAmount: 2000000 },
    'expenses:create': { scope: 'global' },
    'reports:*': { scope: 'global' },
    'reports:generate': { scope: 'global' },
    'reports:export': { scope: 'global' },
    'users:read': { scope: 'global' },
    'users:manage': { scope: 'global' },
    'purchases:read': { scope: 'global' },
    'purchases:approve': { scope: 'global', maxAmount: 5000000 },
    'analytics:read': { scope: 'global' },
  },
};

// ✅ EXPORT THIS - Used by RBAC
export function getPermissionConfig(role: UserRole, permission: string): PermissionConfig | true | undefined {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return undefined;

  // Check for exact match
  if (rolePermissions[permission]) return rolePermissions[permission];

  // Check for wildcard matches
  for (const [key, value] of Object.entries(rolePermissions)) {
    if (key.endsWith(':*')) {
      const prefix = key.slice(0, -2);
      if (permission.startsWith(prefix)) return value;
    }
  }

  return undefined;
}

// ✅ EXPORT THIS - Used by RBAC
export function hasPermission(role: UserRole, permission: string): boolean {
  const rolePermissions = PERMISSIONS[role];
  if (!rolePermissions) return false;

  // Check for exact match
  if (rolePermissions[permission]) return true;

  // Check for wildcard matches
  for (const key of Object.keys(rolePermissions)) {
    if (key.endsWith(':*')) {
      const prefix = key.slice(0, -2);
      if (permission.startsWith(prefix)) return true;
    }
  }

  return false;
}

// ✅ EXPORT THIS
export function getRolePermissions(role: UserRole): string[] {
  return Object.keys(PERMISSIONS[role] || {});
}