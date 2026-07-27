import { useMemo } from 'react';
import { useAuth } from './useAuth';
import { hasPermission as checkPermission, PERMISSIONS } from '../utils/permissions';
import { UserRole } from '../types';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = useMemo(() => {
    return (permission: string): boolean => {
      if (!user) return false;
      return checkPermission(user.role as UserRole, permission);
    };
  }, [user]);

  const hasRole = useMemo(() => {
    return (roles: UserRole[]): boolean => {
      if (!user) return false;
      return roles.includes(user.role as UserRole);
    };
  }, [user]);

  const isSuperAdmin = useMemo(() => {
    return user?.role === UserRole.SUPER_ADMIN;
  }, [user]);

  const isRegionalManager = useMemo(() => {
    return user?.role === UserRole.REGIONAL_MANAGER;
  }, [user]);

  const isSupervisor = useMemo(() => {  // Changed from isStationManager
    return user?.role === UserRole.SUPERVISOR;
  }, [user]);

  const isAttendant = useMemo(() => {
    return user?.role === UserRole.ATTENDANT;
  }, [user]);

  const isAccountant = useMemo(() => {
    return user?.role === UserRole.ACCOUNTANT;
  }, [user]);

  const getRolePermissions = useMemo(() => {
    if (!user) return [];
    return PERMISSIONS[user.role as UserRole] || [];
  }, [user]);

  const canManageStations = useMemo(() => {
    return hasPermission('stations:*') || hasPermission('stations:manage');
  }, [hasPermission]);

  const canManageSales = useMemo(() => {
    return hasPermission('sales:*') || hasPermission('sales:create');
  }, [hasPermission]);

  const canManageExpenses = useMemo(() => {
    return hasPermission('expenses:*') || hasPermission('expenses:create');
  }, [hasPermission]);

  const canApproveExpenses = useMemo(() => {
    return hasPermission('expenses:approve');
  }, [hasPermission]);

  const canManageUsers = useMemo(() => {
    return hasPermission('users:*') || hasPermission('users:manage');
  }, [hasPermission]);

  const canViewReports = useMemo(() => {
    return hasPermission('reports:read') || hasPermission('reports:generate');
  }, [hasPermission]);

  const canManagePurchases = useMemo(() => {
    return hasPermission('purchases:*') || hasPermission('purchases:create');
  }, [hasPermission]);

  const canApprovePurchases = useMemo(() => {
    return hasPermission('purchases:approve');
  }, [hasPermission]);

  const canManageLogistics = useMemo(() => {
    return hasPermission('logistics:*') || hasPermission('logistics:manage');
  }, [hasPermission]);

  const canManageEmployees = useMemo(() => {
    return hasPermission('employees:*') || hasPermission('employees:manage');
  }, [hasPermission]);

  const canManageSupport = useMemo(() => {
    return hasPermission('support:*') || hasPermission('support:manage');
  }, [hasPermission]);

  const canViewAnalytics = useMemo(() => {
    return hasPermission('analytics:read');
  }, [hasPermission]);

  return {
    hasPermission,
    hasRole,
    isSuperAdmin,
    isRegionalManager,
    isSupervisor,  // Changed from isStationManager
    isAttendant,
    isAccountant,
    getRolePermissions,
    canManageStations,
    canManageSales,
    canManageExpenses,
    canApproveExpenses,
    canManageUsers,
    canViewReports,
    canManagePurchases,
    canApprovePurchases,
    canManageLogistics,
    canManageEmployees,
    canManageSupport,
    canViewAnalytics,
  };
};

export default usePermissions;