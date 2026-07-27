import { UserRole, ExpenseCategory, SupportTicketPriority } from '../types';

export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  REGIONAL_MANAGER: 'REGIONAL_MANAGER',
  SUPERVISOR: 'SUPERVISOR',  // Changed from SUPERVISOR
  ATTENDANT: 'ATTENDANT',
  ACCOUNTANT: 'ACCOUNTANT',
  // DEPOT_MANAGER removed
} as const;

export const ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'Super Administrator',
  [UserRole.REGIONAL_MANAGER]: 'Regional Manager',
  [UserRole.SUPERVISOR]: 'Supervisor',  // Changed from Station Manager
  [UserRole.ATTENDANT]: 'Attendant',
  [UserRole.ACCOUNTANT]: 'Accountant',
  // DEPOT_MANAGER removed
};

export const ROLE_COLORS: Record<UserRole, string> = {
  [UserRole.SUPER_ADMIN]: 'bg-purple-100 text-purple-700',
  [UserRole.REGIONAL_MANAGER]: 'bg-blue-100 text-blue-700',
  [UserRole.SUPERVISOR]: 'bg-green-100 text-green-700',
  [UserRole.ATTENDANT]: 'bg-gray-100 text-gray-700',
  [UserRole.ACCOUNTANT]: 'bg-orange-100 text-orange-700',
  // DEPOT_MANAGER removed
};

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FUEL_FOR_GENS]: 'Fuel for Generators',
  [ExpenseCategory.MAINTENANCE]: 'Maintenance',
  [ExpenseCategory.SALARIES]: 'Salaries',
  [ExpenseCategory.UTILITIES]: 'Utilities',
  [ExpenseCategory.ADMINISTRATIVE]: 'Administrative',
  [ExpenseCategory.OPERATIONAL]: 'Operational',
};

export const EXPENSE_CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  [ExpenseCategory.FUEL_FOR_GENS]: 'bg-yellow-100 text-yellow-700',
  [ExpenseCategory.MAINTENANCE]: 'bg-blue-100 text-blue-700',
  [ExpenseCategory.SALARIES]: 'bg-purple-100 text-purple-700',
  [ExpenseCategory.UTILITIES]: 'bg-green-100 text-green-700',
  [ExpenseCategory.ADMINISTRATIVE]: 'bg-red-100 text-red-700',
  [ExpenseCategory.OPERATIONAL]: 'bg-gray-100 text-gray-700',
};

export const SUPPORT_PRIORITY_LABELS: Record<SupportTicketPriority, string> = {
  [SupportTicketPriority.LOW]: 'Low',
  [SupportTicketPriority.MEDIUM]: 'Medium',
  [SupportTicketPriority.HIGH]: 'High',
  [SupportTicketPriority.URGENT]: 'Urgent',
};

export const SUPPORT_PRIORITY_COLORS: Record<SupportTicketPriority, string> = {
  [SupportTicketPriority.LOW]: 'bg-gray-100 text-gray-700',
  [SupportTicketPriority.MEDIUM]: 'bg-blue-100 text-blue-700',
  [SupportTicketPriority.HIGH]: 'bg-yellow-100 text-yellow-700',
  [SupportTicketPriority.URGENT]: 'bg-red-100 text-red-700',
};

export const PAYMENT_METHOD_LABELS = {
  CASH: 'Cash',
  POS: 'POS',
  TRANSFER: 'Bank Transfer',
  CREDIT: 'Credit',
};

export const PAYMENT_METHOD_COLORS = {
  CASH: 'bg-green-100 text-green-700',
  POS: 'bg-blue-100 text-blue-700',
  TRANSFER: 'bg-purple-100 text-purple-700',
  CREDIT: 'bg-yellow-100 text-yellow-700',
};

export const TRANSACTION_STATUS_LABELS = {
  PENDING: 'Pending',
  COMPLETED: 'Completed',
  VERIFIED: 'Verified',
  CANCELLED: 'Cancelled',
  REFUNDED: 'Refunded',
};

export const TRANSACTION_STATUS_COLORS = {
  PENDING: 'bg-yellow-100 text-yellow-700',
  COMPLETED: 'bg-green-100 text-green-700',
  VERIFIED: 'bg-blue-100 text-blue-700',
  CANCELLED: 'bg-red-100 text-red-700',
  REFUNDED: 'bg-gray-100 text-gray-700',
};

export const TANK_STATUS_LABELS = {
  NORMAL: 'Normal',
  WARNING: 'Warning',
  CRITICAL: 'Critical',
};

export const TANK_STATUS_COLORS = {
  NORMAL: 'bg-green-100 text-green-700',
  WARNING: 'bg-yellow-100 text-yellow-700',
  CRITICAL: 'bg-red-100 text-red-700',
};

export const PURCHASE_ORDER_STATUS_LABELS = {
  DRAFT: 'Draft',
  PENDING_APPROVAL: 'Pending Approval',
  APPROVED: 'Approved',
  IN_TRANSIT: 'In Transit',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
};

export const PURCHASE_ORDER_STATUS_COLORS = {
  DRAFT: 'bg-gray-100 text-gray-700',
  PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
  APPROVED: 'bg-green-100 text-green-700',
  IN_TRANSIT: 'bg-blue-100 text-blue-700',
  DELIVERED: 'bg-purple-100 text-purple-700',
  CANCELLED: 'bg-red-100 text-red-700',
};

export const CURRENCY_SYMBOL = '₦';
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATE_TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

export const APP_NAME = 'Rekaz Petroleum';
export const APP_VERSION = '2.4.0';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  USERS: '/users',
  STATIONS: '/stations',
  SALES: '/sales',
  PURCHASES: '/purchases',
  PUMPS: '/pumps',
  EXPENSES: '/expenses',
  INVENTORY: '/inventory',
  LOGISTICS: '/logistics',
  EMPLOYEES: '/employees',
  REPORTS: '/reports',
  ANALYTICS: '/analytics',
  SETTINGS: '/settings',
  SUPPORT: '/support',
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  LIMIT_OPTIONS: [10, 25, 50, 100],
};

export const FILE_TYPES = {
  ALLOWED_IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_IMAGE_SIZE: 5 * 1024 * 1024, // 5MB
  ALLOWED_DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  MAX_DOCUMENT_SIZE: 10 * 1024 * 1024, // 10MB
};

export const DEFAULT_PAGE_TITLE = 'Rekaz Petroleum Management System';