// ============= ENUMS =============
// ============= USER ROLE ENUM =============
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  REGIONAL_MANAGER = 'REGIONAL_MANAGER',
  SUPERVISOR = 'SUPERVISOR',
  ATTENDANT = 'ATTENDANT',
  ACCOUNTANT = 'ACCOUNTANT',
}

export enum PaymentMethod {
  CASH = 'CASH',
  POS = 'POS',
  TRANSFER = 'TRANSFER',
  CREDIT = 'CREDIT',
}

export enum TransactionStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  VERIFIED = 'VERIFIED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export enum ExpenseCategory {
  FUEL_FOR_GENS = 'FUEL_FOR_GENS',
  MAINTENANCE = 'MAINTENANCE',
  SALARIES = 'SALARIES',
  UTILITIES = 'UTILITIES',
  ADMINISTRATIVE = 'ADMINISTRATIVE',
  OPERATIONAL = 'OPERATIONAL',
}

export enum TankStatus {
  NORMAL = 'NORMAL',
  WARNING = 'WARNING',
  CRITICAL = 'CRITICAL',
}

export enum PurchaseOrderStatus {
  DRAFT = 'DRAFT',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  APPROVED = 'APPROVED',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export enum SupportTicketStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

export enum SupportTicketPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  URGENT = 'URGENT',
}

export enum NotificationType {
  ALERT = 'ALERT',
  INFO = 'INFO',
  WARNING = 'WARNING',
  SUCCESS = 'SUCCESS',
}

export enum AuditAction {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  CREATE = 'CREATE',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  VERIFY = 'VERIFY',
  EXPORT = 'EXPORT',
  IMPORT = 'IMPORT',
}

// ============= USER TYPES =============
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  stationId?: string;
  regionId?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  profileImage?: string;
  name: string;
  permissions?: string[]; 
  department?: string;
  station?: Station;
  region?: Region;
  settings?: Settings;
  employeeRecords?: Employee[];
  sales?: Sale[];
  verifiedSales?: Sale[];
  expensesCreated?: Expense[];
  expensesApproved?: Expense[];
  purchasesCreated?: PurchaseOrder[];
  purchasesApproved?: PurchaseOrder[];
  inventoryLogs?: InventoryLog[];
  auditLogs?: AuditLog[];
  notifications?: Notification[];
  supportTickets?: SupportTicket[];
  assignedTickets?: SupportTicket[];
}

export interface Region {
  id: string;
  name: string;
  code: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  users?: User[];
  stations?: Station[];
}


export interface Station {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  state: string;
  regionId: string;
  managerId?: string;
  isActive: boolean;
  latitude?: number;
  longitude?: number;
  phone?: string;
  email?: string;
  imageUrl?: string;
  openingTime?: string;
  closingTime?: string;
  createdAt: string;
  updatedAt: string;
  region: Region;
  manager?: User;
  tanks: Tank[];
  pumps: Pump[];
  sales?: Sale[];
  expenses?: Expense[];
  pumpReadings?: PumpReading[];
  inventoryLogs?: InventoryLog[];
  deliveries?: Delivery[];
  totalSales?: number;
}

// ============= INVENTORY TYPES =============
export interface Tank {
  id: string;
  stationId: string;
  productType: string;
  name: string;
  capacity: number;
  currentLevel: number;
  percentage: number;
  status: TankStatus;
  lastUpdated: string;
  createdAt: string;
  updatedAt: string;
  station: Station;
  inventoryLogs?: InventoryLog[];
}

export interface InventoryLog {
  id: string;
  stationId: string;
  tankId?: string;
  productType: string;
  previousLevel: number;
  newLevel: number;
  adjustment: number;
  reason: string;
  userId: string;
  createdAt: string;
  station: Station;
  tank?: Tank;
  user: User;
}

// ============= PUMP TYPES =============
export interface Pump {
  id: string;
  stationId: string;
  pumpNumber: number;
  productType: string;
  openingMeter: number;
  closingMeter: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  station: Station;
  readings?: PumpReading[];
  sales?: Sale[];
}

export interface PumpReading {
  id: string;
  pumpId: string;
  attendantId: string;
  stationId: string;
  openingMeter: number;
  closingMeter: number;
  litresSold: number;
  expectedRevenue: number;
  readingDate: string;
  createdAt: string;
  pump: Pump;
  attendant: User;
  station: Station;
}

// ============= SALES TYPES =============
export interface Sale {
  id: string;
  stationId: string;
  pumpId?: string;
  productType: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalAmount: number;
  paymentMethod: PaymentMethod;
  status: TransactionStatus;
  customerName?: string;
  customerPhone?: string;
  attendantId: string;
  verifiedById?: string;
  verifiedAt?: string;
  createdAt: string;
  updatedAt: string;
  station: Station;
  pump?: Pump;
  attendant: User;
  verifiedBy?: User;
}

export interface DailyReport {
  date: string;
  totalSales: number;
  totalVolume: number;
  transactionCount: number;
  paymentBreakdown: {
    method: PaymentMethod;
    amount: number;
    count: number;
    percentage: number;
  }[];
  transactions: Sale[];
  variance?: number;
  openingCash?: number;
  closingCash?: number;
  bankDeposits?: number;
}

export interface ReconciliationData {
  date: string;
  openingCash: number;
  bankDeposits: number;
  closingCash: number;
  totalSales: number;
  totalExpenses: number;
  expectedClosing: number;
  variance: number;
  paymentBreakdown: {
    method: PaymentMethod;
    amount: number;
    count: number;
    percentage: number;
  }[];
}

// ============= EXPENSES TYPES =============
export interface Expense {
  id: string;
  stationId: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  voucherNumber: string;
  receiptUrl?: string;
  approvedById?: string;
  approvedAt?: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  station: Station;
  approvedBy?: User;
  createdBy: User;
}

export interface ExpenseSummary {
  total: number;
  breakdown: {
    category: ExpenseCategory;
    amount: number;
    count: number;
    percentage: number;
  }[];
  pendingApprovals: number;
  approvedTotal: number;
  pendingTotal: number;
}

// ============= PURCHASES TYPES =============
export interface PurchaseOrder {
  id: string;
  supplierName: string;
  supplierId?: string;
  supplierEmail?: string;
  supplierPhone?: string;
  stationId?: string;
  productType: string;
  volume: number;
  unitCost: number;
  totalCost: number;
  expectedDelivery?: string;
  actualDelivery?: string;
  status: PurchaseOrderStatus;
  orderNumber: string;
  invoiceNumber?: string;
  paymentStatus: string;
  createdById: string;
  approvedById?: string;
  approvedAt?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  approvedBy?: User;
  deliveries: Delivery[];
}

export interface PurchaseOrderSummary {
  totalOrders: number;
  totalCost: number;
  byStatus: {
    status: PurchaseOrderStatus;
    count: number;
    totalCost: number;
  }[];
  pendingApprovals: number;
  inTransit: number;
  delivered: number;
}

// ============= LOGISTICS TYPES =============
export interface Delivery {
  id: string;
  purchaseOrderId: string;
  stationId?: string;
  tankerId: string;
  volume: number;
  dispatchedAt: string;
  deliveredAt?: string;
  status: string;
  currentLocation?: string;
  driverName?: string;
  driverPhone?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  purchaseOrder: PurchaseOrder;
  station?: Station;
  locationLogs: DeliveryLocationLog[];
}

export interface DeliveryLocationLog {
  id: string;
  deliveryId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  notes?: string;
  delivery: Delivery;
}

export interface FleetStatus {
  totalVehicles: number;
  available: number;
  inTransit: number;
  maintenance: number;
  vehicles: {
    id: string;
    tankerId: string;
    status: string;
    driverName?: string;
    currentLocation?: string;
    fuelLevel?: number;
    lastService?: string;
  }[];
}

export interface TrackingData {
  deliveryId: string;
  tankerId: string;
  status: string;
  currentLocation?: string;
  eta?: string;
  distance?: number;
  driverName?: string;
  driverPhone?: string;
  dispatchedAt: string;
  deliveredAt?: string;
  locationLogs: DeliveryLocationLog[];
  purchaseOrder: {
    supplierName: string;
    productType: string;
    volume: number;
  };
}

// ============= EMPLOYEE TYPES =============
export interface Employee {
  id: string;
  userId: string;
  stationId: string;
  employeeId: string;
  position: string;
  department: string;
  hireDate: string;
  salary?: number;
  bankName?: string;
  accountNumber?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  station: Station;
}

export interface EmployeeStatistics {
  total: number;
  active: number;
  inactive: number;
  byDepartment: {
    department: string;
    count: number;
  }[];
  byPosition: {
    position: string;
    count: number;
  }[];
}

// ============= SUPPORT TYPES =============
export interface SupportTicket {
  id: string;
  ticketNumber: string;
  title: string;
  description: string;
  status: SupportTicketStatus;
  priority: SupportTicketPriority;
  category: string;
  createdById: string;
  assignedToId?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: User;
  assignedTo?: User;
  comments: SupportTicketComment[];
}

export interface SupportTicketComment {
  id: string;
  ticketId: string;
  userId: string;
  message: string;
  isInternal: boolean;
  createdAt: string;
  ticket: SupportTicket;
  user: User;
}

export interface SupportTicketStatistics {
  total: number;
  open: number;
  inProgress: number;
  resolved: number;
  closed: number;
  byPriority: {
    priority: SupportTicketPriority;
    count: number;
  }[];
  byCategory: {
    category: string;
    count: number;
  }[];
  averageResolutionHours: number;
}

// ============= SETTINGS TYPES =============
export interface Settings {
  id: string;
  userId: string;
  theme: string;
  language: string;
  notifications: Record<string, any>;
  preferences: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  user: User;
}

export interface SystemSettings {
  id: string;
  key: string;
  value: any;
  description?: string;
  category: string;
  isEditable: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============= NOTIFICATION TYPES =============
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  isRead: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  user: User;
}

// ============= AUDIT TYPES =============
export interface AuditLog {
  id: string;
  userId: string;
  action: AuditAction;
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user: User;
}

// ============= API RESPONSE TYPES =============
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: any[];
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
  stationId?: string;
  regionId?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface ResetPasswordData {
  token: string;
  newPassword: string;
}

// ============= REPORT TYPES =============
export interface SalesReport {
  summary: {
    totalSales: number;
    totalVolume: number;
    transactionCount: number;
    averageTransactionValue: number;
  };
  paymentBreakdown: {
    method: PaymentMethod;
    amount: number;
    count: number;
    percentage: number;
  }[];
  productBreakdown: {
    productType: string;
    productName: string;
    quantity: number;
    totalAmount: number;
  }[];
  dailyBreakdown: {
    date: string;
    sales: number;
    volume: number;
    transactions: number;
  }[];
  dateRange: { startDate: string; endDate: string };
}

export interface FinancialReport {
  summary: {
    totalRevenue: number;
    totalExpenses: number;
    profit: number;
    profitMargin: number;
    transactionCount: number;
    expenseCount: number;
  };
  expensesByCategory: {
    category: ExpenseCategory;
    amount: number;
    count: number;
    percentage: number;
  }[];
  revenueByProduct: {
    productType: string;
    amount: number;
    percentage: number;
  }[];
  dailyBreakdown: {
    date: string;
    revenue: number;
    expenses: number;
    profit: number;
  }[];
  dateRange: { startDate: string; endDate: string };
}

export interface InventoryReport {
  tanks: {
    id: string;
    name: string;
    productType: string;
    capacity: number;
    currentLevel: number;
    percentage: number;
    status: TankStatus;
    stationName: string;
  }[];
  summary: {
    totalTanks: number;
    totalCapacity: number;
    totalCurrentLevel: number;
    averagePercentage: number;
    lowStockCount: number;
    criticalStockCount: number;
  };
  movement: {
    productType: string;
    reason: string;
    totalAdjustment: number;
    count: number;
  }[];
  lowStock: {
    tankId: string;
    tankName: string;
    stationName: string;
    percentage: number;
    currentLevel: number;
  }[];
}

export interface StationReport {
  station: Station;
  performance: {
    totalSales: number;
    totalVolume: number;
    transactionCount: number;
    averageDailySales: number;
    totalExpenses: number;
    profit: number;
  };
  dailyTrend: {
    date: string;
    sales: number;
    volume: number;
    transactions: number;
  }[];
  topProducts: {
    productType: string;
    productName: string;
    quantity: number;
    totalAmount: number;
  }[];
  dateRange: { startDate: string; endDate: string };
}

// ============= ANALYTICS TYPES =============
export interface PerformanceMetrics {
  stationId: string;
  stationName: string;
  period: { startDate: string; endDate: string };
  metrics: {
    totalSales: number;
    totalVolume: number;
    transactionCount: number;
    averageTransactionValue: number;
    totalExpenses: number;
    profit: number;
    profitMargin: number;
    growthRate: number;
    customerSatisfaction?: number;
  };
  trends: {
    daily: {
      date: string;
      value: number;
    }[];
    weekly: {
      week: string;
      value: number;
    }[];
    monthly: {
      month: string;
      value: number;
    }[];
  };
  benchmarks?: {
    average: number;
    best: number;
    worst: number;
  };
}

export interface TrendsAnalysis {
  metric: string;
  dataPoints: {
    date: string;
    value: number;
  }[];
  statistics: {
    mean: number;
    median: number;
    min: number;
    max: number;
    standardDeviation: number;
    variance: number;
  };
  forecast: {
    date: string;
    value: number;
    confidenceLower: number;
    confidenceUpper: number;
  }[];
  seasonality?: {
    dayOfWeek: { day: string; avgValue: number }[];
    monthOfYear: { month: string; avgValue: number }[];
  };
}

export interface StationComparison {
  stations: {
    id: string;
    name: string;
    value: number;
    rank: number;
    performance: 'Excellent' | 'Good' | 'Average' | 'Below Average';
  }[];
  metric: string;
  period: { startDate: string; endDate: string };
  statistics: {
    average: number;
    max: number;
    min: number;
    total: number;
    median: number;
  };
}

export interface RevenueForecast {
  stationId: string;
  stationName: string;
  forecast: {
    date: string;
    predictedRevenue: number;
    lowerBound: number;
    upperBound: number;
    confidence: number;
  }[];
  summary: {
    totalPredicted: number;
    averageDaily: number;
    growthRate: number;
    confidenceLevel: number;
  };
  factors: {
    name: string;
    impact: 'positive' | 'negative' | 'neutral';
    description: string;
  }[];
}

export interface PredictiveAnalytics {
  metric: string;
  currentValue: number;
  predictedValues: {
    date: string;
    value: number;
    confidenceLower: number;
    confidenceUpper: number;
  }[];
  insights: {
    trend: 'upward' | 'downward' | 'stable';
    rateOfChange: number;
    recommendation: string;
  };
  anomalies: {
    date: string;
    value: number;
    expectedValue: number;
    deviation: number;
    severity: 'low' | 'medium' | 'high';
  }[];
}

// ============= WEBSOCKET TYPES =============
export interface WebSocketMessage {
  type: 'TANK_UPDATE' | 'NEW_SALE' | 'ALERT' | 'DELIVERY_UPDATE' | 'NOTIFICATION' | 'SYSTEM_STATUS';
  data: any;
  timestamp: string;
}

export interface TankUpdateMessage {
  tankId: string;
  stationId: string;
  currentLevel: number;
  percentage: number;
  status: TankStatus;
  timestamp: string;
}

export interface SaleAlertMessage {
  saleId: string;
  stationId: string;
  stationName: string;
  amount: number;
  productType: string;
  paymentMethod: PaymentMethod;
  timestamp: string;
}

export interface DeliveryUpdateMessage {
  deliveryId: string;
  tankerId: string;
  status: string;
  currentLocation?: string;
  estimatedArrival?: string;
  timestamp: string;
}

export interface NotificationMessage {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

export interface SystemStatusMessage {
  status: 'online' | 'offline' | 'degraded';
  services: {
    name: string;
    status: 'healthy' | 'unhealthy' | 'degraded';
    details?: string;
  }[];
  timestamp: string;
}

// ============= JOB TYPES =============
export interface JobData {
  type: 'DAILY_REPORT' | 'INVENTORY_ALERT' | 'DELIVERY_REMINDER' | 'BACKUP' | 'SYNC' | 'CLEANUP';
  data: any;
  scheduledAt: string;
  priority: 'low' | 'medium' | 'high';
}

export interface JobResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  executedAt: string;
  duration: number;
}

export interface ScheduledJob {
  id: string;
  name: string;
  schedule: string;
  enabled: boolean;
  lastRun?: string;
  nextRun?: string;
  status: 'idle' | 'running' | 'failed' | 'completed';
  history: {
    runAt: string;
    success: boolean;
    duration: number;
    error?: string;
  }[];
}

// ============= DASHBOARD TYPES =============
export interface ExecutiveDashboardData {
  date: string;
  totalDailySales: number;
  totalDailyVolume: number;
  totalTransactions: number;
  fuelStockLevels: {
    pms: number;
    ago: number;
    lpg: number;
    dpk: number;
  };
  totalExpenses: number;
  pendingApprovals: {
    expenses: number;
    purchases: number;
    tickets: number;
  };
  salesByProduct: {
    product: string;
    amount: number;
    percentage: number;
  }[];
  topPerformingStations: {
    id: string;
    name: string;
    manager: string;
    sales: number;
    target: number;
    percentage: number;
    health: 'normal' | 'warning' | 'critical';
  }[];
  recentActivity: {
    title: string;
    description: string;
    time: string;
    type: 'sale' | 'expense' | 'inventory' | 'delivery' | 'approval' | 'alert';
    priority?: 'low' | 'medium' | 'high';
  }[];
  alerts: {
    id: string;
    type: 'low_stock' | 'system' | 'security' | 'delivery';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }[];
}

export interface RegionalDashboardData {
  regionId: string;
  regionName: string;
  date: string;
  totalStations: number;
  totalSales: number;
  totalVolume: number;
  totalTransactions: number;
  activeStations: number;
  stationPerformance: {
    id: string;
    name: string;
    code: string;
    manager: string;
    sales: number;
    volume: number;
    transactions: number;
    performance: 'Excellent' | 'Good' | 'Average' | 'Below Average';
  }[];
  salesByProduct: {
    product: string;
    amount: number;
    percentage: number;
  }[];
  monthlyTrend: {
    month: string;
    sales: number;
    volume: number;
  }[];
  alerts: {
    stationName: string;
    type: string;
    message: string;
    severity: 'info' | 'warning' | 'critical';
  }[];
}

export interface StationDashboardData {
  station: Station;
  date: string;
  today: {
    sales: number;
    volume: number;
    transactions: number;
    expenses: number;
  };
  monthlySales: number;
  monthlyVolume: number;
  monthlyTransactions: number;
  monthlyExpenses: number;
  tanks: Tank[];
  pumps: Pump[];
  recentTransactions: Sale[];
  recentExpenses: Expense[];
  inventoryHealth: {
    tank: string;
    product: string;
    level: number;
    capacity: number;
    percentage: number;
    status: TankStatus;
  }[];
  alerts: {
    type: 'low_stock' | 'pump_issue' | 'system' | 'delivery';
    severity: 'info' | 'warning' | 'critical';
    message: string;
    timestamp: string;
  }[];
  quickStats: {
    label: string;
    value: string;
    change: number;
    icon: string;
  }[];
}

// ============= PUMP SPECIFIC TYPES =============
export interface PumpDashboardData {
  stationId: string;
  stationName: string;
  totalPumps: number;
  activePumps: number;
  inactivePumps: number;
  pumps: {
    id: string;
    pumpNumber: number;
    productType: string;
    isActive: boolean;
    todayReadings: number;
    todayVolume: number;
    todayRevenue: number;
  }[];
  dailyReadings: {
    date: string;
    totalVolume: number;
    totalRevenue: number;
  }[];
  topPumps: {
    pumpNumber: number;
    productType: string;
    volume: number;
    revenue: number;
  }[];
}

// ============= EXPENSE SPECIFIC TYPES =============
export interface ExpenseApproval {
  id: string;
  expenseId: string;
  stationId: string;
  stationName: string;
  category: ExpenseCategory;
  description: string;
  amount: number;
  voucherNumber: string;
  createdBy: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'rejected';
  approver?: string;
  approvedAt?: string;
  comments?: string;
}

// ============= PURCHASE SPECIFIC TYPES =============
export interface CreatePurchaseOrderData {
  supplierName: string;
  supplierEmail?: string;
  supplierPhone?: string;
  productType: string;
  volume: number;
  unitCost: number;
  expectedDelivery?: string;
  notes?: string;
  stationId?: string;
}

// ============= SETTINGS SPECIFIC TYPES =============
export interface SystemSettingsData {
  stationDefaults: {
    openingTime: string;
    closingTime: string;
    defaultProductType: string;
  };
  pricing: {
    pmsPrice: number;
    agoPrice: number;
    lpgPrice: number;
    dpkPrice: number;
  };
  notifications: {
    lowStockThreshold: number;
    criticalStockThreshold: number;
    deliveryReminderHours: number;
    autoApproveExpenseLimit: number;
  };
  security: {
    maxLoginAttempts: number;
    sessionTimeoutMinutes: number;
    requireTwoFactor: boolean;
    passwordExpiryDays: number;
  };
  integration: {
    enableEmail: boolean;
    enableSMS: boolean;
    enablePushNotifications: boolean;
  };
}

// ============= VALIDATION TYPES =============
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// ============= FILTER TYPES =============
export interface DateRangeFilter {
  startDate: Date;
  endDate: Date;
}

export interface PaginationFilter {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface StationFilter {
  stationId?: string;
  regionId?: string;
  isActive?: boolean;
}

export interface SalesFilter extends DateRangeFilter, StationFilter {
  productType?: string;
  paymentMethod?: PaymentMethod;
  status?: TransactionStatus;
  minAmount?: number;
  maxAmount?: number;
}

export interface ExpenseFilter extends DateRangeFilter, StationFilter {
  category?: ExpenseCategory;
  isApproved?: boolean;
  minAmount?: number;
  maxAmount?: number;
}

export interface PurchaseFilter extends DateRangeFilter {
  status?: PurchaseOrderStatus;
  supplierId?: string;
  productType?: string;
  stationId?: string;
}

export interface EmployeeFilter {
  stationId?: string;
  department?: string;
  position?: string;
  isActive?: boolean;
}

export interface SupportFilter {
  status?: SupportTicketStatus;
  priority?: SupportTicketPriority;
  category?: string;
  assignedToId?: string;
  createdById?: string;
}

// ============= CHART DATA TYPES =============
export interface ChartDataPoint {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    borderColor?: string;
    backgroundColor?: string;
    fill?: boolean;
  }[];
}

export interface BarChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

export interface PieChartData {
  labels: string[];
  datasets: {
    data: number[];
    backgroundColor?: string[];
    borderColor?: string[];
  }[];
}

// ============= EXPORT TYPES =============
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv' | 'json';
  filename: string;
  includeHeaders: boolean;
  includeFooter?: boolean;
  pageSize?: 'A4' | 'Letter' | 'Legal';
  orientation?: 'portrait' | 'landscape';
}

export interface ExportResult {
  url: string;
  filename: string;
  size: number;
  format: string;
  generatedAt: string;
}

// ============= UPLOAD TYPES =============
export interface UploadOptions {
  file: File;
  type: 'receipt' | 'profile' | 'document' | 'report';
  metadata?: Record<string, any>;
}

export interface UploadResult {
  id: string;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
  uploadedAt: string;
}