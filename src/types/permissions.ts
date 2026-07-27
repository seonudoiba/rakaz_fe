// types/permissions.ts
import { UserRole } from './index';

// Define all available permissions
export type Permission = 
  // Dashboard permissions
  | 'view_dashboard'
  | 'view_regional_dashboard'
  | 'view_station_dashboard'
  
  // Sales permissions
  | 'view_sales'
  | 'create_sales'
  | 'edit_sales'
  | 'delete_sales'
  | 'verify_sales'
  | 'view_sales_reports'
  | 'export_sales_data'
  
  // Expense permissions
  | 'view_expenses'
  | 'create_expenses'
  | 'edit_expenses'
  | 'delete_expenses'
  | 'approve_expenses'
  | 'view_expense_reports'
  
  // Inventory permissions
  | 'view_inventory'
  | 'manage_inventory'
  | 'adjust_inventory'
  | 'view_inventory_reports'
  | 'manage_tanks'
  
  // Pump permissions
  | 'view_pumps'
  | 'manage_pumps'
  | 'view_pump_readings'
  | 'record_pump_readings'
  
  // Purchase Order permissions
  | 'view_purchases'
  | 'create_purchases'
  | 'edit_purchases'
  | 'delete_purchases'
  | 'approve_purchases'
  | 'view_purchase_reports'
  
  // Delivery permissions
  | 'view_deliveries'
  | 'manage_deliveries'
  | 'track_deliveries'
  | 'view_delivery_reports'
  
  // Employee permissions
  | 'view_employees'
  | 'manage_employees'
  | 'edit_employees'
  | 'delete_employees'
  
  // User Management permissions
  | 'view_users'
  | 'manage_users'
  | 'edit_users'
  | 'delete_users'
  | 'manage_roles'
  
  // Station Management permissions
  | 'view_stations'
  | 'manage_stations'
  | 'edit_stations'
  | 'delete_stations'
  
  // Region Management permissions
  | 'view_regions'
  | 'manage_regions'
  | 'edit_regions'
  | 'delete_regions'
  
  // Support Ticket permissions
  | 'view_tickets'
  | 'create_tickets'
  | 'edit_tickets'
  | 'delete_tickets'
  | 'assign_tickets'
  | 'resolve_tickets'
  
  // Settings permissions
  | 'view_settings'
  | 'manage_settings'
  | 'edit_settings'
  
  // Reporting permissions
  | 'view_reports'
  | 'view_financial_reports'
  | 'view_analytics'
  | 'export_reports'
  | 'generate_reports'
  
  // Audit permissions
  | 'view_audit_logs'
  | 'view_system_logs'
  
  // Notification permissions
  | 'send_notifications'
  | 'manage_notifications'
  
  // System permissions
  | 'manage_system'
  | 'view_system_status'
  | 'manage_backups'
  | 'manage_integrations';

// Role-based permission mappings
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  [UserRole.SUPER_ADMIN]: [
    // Full access to everything
    'view_dashboard', 'view_regional_dashboard', 'view_station_dashboard',
    'view_sales', 'create_sales', 'edit_sales', 'delete_sales', 'verify_sales',
    'view_sales_reports', 'export_sales_data',
    'view_expenses', 'create_expenses', 'edit_expenses', 'delete_expenses',
    'approve_expenses', 'view_expense_reports',
    'view_inventory', 'manage_inventory', 'adjust_inventory', 'view_inventory_reports',
    'manage_tanks',
    'view_pumps', 'manage_pumps', 'view_pump_readings', 'record_pump_readings',
    'view_purchases', 'create_purchases', 'edit_purchases', 'delete_purchases',
    'approve_purchases', 'view_purchase_reports',
    'view_deliveries', 'manage_deliveries', 'track_deliveries', 'view_delivery_reports',
    'view_employees', 'manage_employees', 'edit_employees', 'delete_employees',
    'view_users', 'manage_users', 'edit_users', 'delete_users', 'manage_roles',
    'view_stations', 'manage_stations', 'edit_stations', 'delete_stations',
    'view_regions', 'manage_regions', 'edit_regions', 'delete_regions',
    'view_tickets', 'create_tickets', 'edit_tickets', 'delete_tickets',
    'assign_tickets', 'resolve_tickets',
    'view_settings', 'manage_settings', 'edit_settings',
    'view_reports', 'view_financial_reports', 'view_analytics',
    'export_reports', 'generate_reports',
    'view_audit_logs', 'view_system_logs',
    'send_notifications', 'manage_notifications',
    'manage_system', 'view_system_status', 'manage_backups', 'manage_integrations'
  ],

  [UserRole.REGIONAL_MANAGER]: [
    // Regional oversight
    'view_dashboard', 'view_regional_dashboard',
    'view_sales', 'create_sales', 'verify_sales', 'view_sales_reports',
    'view_expenses', 'create_expenses', 'approve_expenses', 'view_expense_reports',
    'view_inventory', 'view_inventory_reports',
    'view_pumps', 'view_pump_readings',
    'view_purchases', 'create_purchases', 'approve_purchases', 'view_purchase_reports',
    'view_deliveries', 'track_deliveries', 'view_delivery_reports',
    'view_employees', 'manage_employees', 'edit_employees',
    'view_users',
    'view_stations', 'manage_stations', 'edit_stations',
    'view_regions',
    'view_tickets', 'create_tickets', 'assign_tickets', 'resolve_tickets',
    'view_settings',
    'view_reports', 'view_financial_reports', 'view_analytics',
    'export_reports', 'generate_reports',
    'view_audit_logs'
  ],

  [UserRole.SUPERVISOR]: [
    // Station-level management
    'view_dashboard', 'view_station_dashboard',
    'view_sales', 'create_sales', 'edit_sales', 'verify_sales', 'view_sales_reports',
    'view_expenses', 'create_expenses', 'edit_expenses', 'view_expense_reports',
    'view_inventory', 'manage_inventory', 'adjust_inventory', 'view_inventory_reports',
    'manage_tanks',
    'view_pumps', 'manage_pumps', 'view_pump_readings', 'record_pump_readings',
    'view_purchases', 'create_purchases', 'view_purchase_reports',
    'view_deliveries', 'manage_deliveries', 'track_deliveries', 'view_delivery_reports',
    'view_employees', 'manage_employees', 'edit_employees',
    'view_users',
    'view_tickets', 'create_tickets', 'edit_tickets', 'assign_tickets',
    'view_settings',
    'view_reports', 'export_reports'
  ],

  [UserRole.ATTENDANT]: [
    // Frontline operations
    'view_dashboard', 'view_station_dashboard',
    'view_sales', 'create_sales', 'view_sales_reports',
    'view_expenses', 'create_expenses',
    'view_inventory',
    'view_pumps', 'view_pump_readings', 'record_pump_readings',
    'view_tickets', 'create_tickets'
  ],


  [UserRole.ACCOUNTANT]: [
    // Financial focus
    'view_dashboard',
    'view_sales', 'verify_sales', 'view_sales_reports', 'export_sales_data',
    'view_expenses', 'approve_expenses', 'view_expense_reports',
    'view_purchases', 'view_purchase_reports',
    'view_reports', 'view_financial_reports', 'export_reports', 'generate_reports',
    'view_audit_logs'
  ]
};

// Permission groups for easier management
export const PERMISSION_GROUPS = {
  SALES: ['view_sales', 'create_sales', 'edit_sales', 'delete_sales', 'verify_sales'],
  EXPENSES: ['view_expenses', 'create_expenses', 'edit_expenses', 'delete_expenses', 'approve_expenses'],
  INVENTORY: ['view_inventory', 'manage_inventory', 'adjust_inventory', 'manage_tanks'],
  USERS: ['view_users', 'manage_users', 'edit_users', 'delete_users', 'manage_roles'],
  REPORTS: ['view_reports', 'export_reports', 'generate_reports', 'view_analytics']
} as const;

// Helper function to check if a role has a specific permission
export const roleHasPermission = (role: UserRole, permission: Permission): boolean => {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
};

// Helper function to get all permissions for a role
export const getPermissionsForRole = (role: UserRole): Permission[] => {
  return ROLE_PERMISSIONS[role] || [];
};

// Helper function to check if a role has any of the given permissions
export const roleHasAnyPermission = (role: UserRole, permissions: Permission[]): boolean => {
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.some(perm => userPermissions.includes(perm));
};

// Helper function to check if a role has all of the given permissions
export const roleHasAllPermissions = (role: UserRole, permissions: Permission[]): boolean => {
  const userPermissions = ROLE_PERMISSIONS[role] || [];
  return permissions.every(perm => userPermissions.includes(perm));
};