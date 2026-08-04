import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { useStation } from "./contexts/StationContext";
import { UserRole } from "./types";
import TankManagement from "./pages/inventory/TankManagement";

// Lazy load components
const Layout = lazy(() => import("./components/layout/Layout"));
const Login = lazy(() => import("./pages/auth/Login"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));

// User Management
const UserManagement = lazy(() => import("./pages/auth/UserManagement"));

// Dashboard
const ExecutiveDashboard = lazy(
  () => import("./pages/dashboard/ExecutiveDashboard"),
);
const RegionalDashboard = lazy(
  () => import("./pages/dashboard/RegionalDashboard"),
);
const StationDashboard = lazy(
  () => import("./pages/dashboard/StationDashboard"),
);

// Station Management
const StationList = lazy(() => import("./pages/stations/StationList"));
const StationDetails = lazy(() => import("./pages/stations/StationDetails"));
const StationManagement = lazy(
  () => import("./pages/stations/StationManagement"),
);

// Sales
const SalesManagement = lazy(() => import("./pages/sales/SalesManagement"));
const DailyReport = lazy(() => import("./pages/sales/DailyReport"));
const Reconciliation = lazy(() => import("./pages/sales/Reconciliation"));

// Purchases
const PurchaseOrders = lazy(() => import("./pages/purchases/PurchaseOrders"));
const CreatePurchaseOrder = lazy(
  () => import("./pages/purchases/CreatePurchaseOrder"),
);
const PurchaseOrderDetails = lazy(
  () => import("./pages/purchases/PurchaseOrderDetails"),
);

// Pumps
const PumpManagement = lazy(() => import("./pages/pumps/PumpManagement"));
const PumpReadings = lazy(() => import("./pages/pumps/PumpReadings"));
const PumpDashboard = lazy(() => import("./pages/pumps/PumpDashboard"));

// Expenses
const ExpenseManagement = lazy(
  () => import("./pages/expenses/ExpenseManagement"),
);
const CreateExpense = lazy(() => import("./pages/expenses/CreateExpense"));
const ExpenseApprovals = lazy(
  () => import("./pages/expenses/ExpenseApprovals"),
);

// Inventory
const TankMonitoring = lazy(() => import("./pages/inventory/TankMonitoring"));
const InventoryAudit = lazy(() => import("./pages/inventory/InventoryAudit"));
const ProductMovement = lazy(() => import("./pages/inventory/ProductMovement"));

// Logistics
const LogisticsManagement = lazy(
  () => import("./pages/logistics/LogisticsManagement"),
);
const DeliveryTracking = lazy(
  () => import("./pages/logistics/DeliveryTracking"),
);
const FleetManagement = lazy(() => import("./pages/logistics/FleetManagement"));

// Employees
const EmployeeList = lazy(() => import("./pages/employees/EmployeeList"));
const EmployeeDetails = lazy(() => import("./pages/employees/EmployeeDetails"));
const EmployeeManagement = lazy(
  () => import("./pages/employees/EmployeeManagement"),
);

// Reports
const ReportsAnalytics = lazy(() => import("./pages/reports/ReportsAnalytics"));
const ReportGenerator = lazy(() => import("./pages/reports/ReportGenerator"));
const FinancialReports = lazy(() => import("./pages/reports/FinancialReports"));

// Analytics
const AnalyticsDashboard = lazy(
  () => import("./pages/analytics/AnalyticsDashboard"),
);
const PerformanceMetrics = lazy(
  () => import("./pages/analytics/PerformanceMetrics"),
);
const TrendsAnalysis = lazy(() => import("./pages/analytics/TrendsAnalysis"));

// Settings
const GeneralSettings = lazy(() => import("./pages/settings/GeneralSettings"));
const UserSettings = lazy(() => import("./pages/settings/UserSettings"));
const SystemSettings = lazy(() => import("./pages/settings/SystemSettings"));

// Support
const SupportTickets = lazy(() => import("./pages/support/SupportTickets"));
const CreateTicket = lazy(() => import("./pages/support/CreateTicket"));
const TicketDetails = lazy(() => import("./pages/support/TicketDetails"));

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleum-seagreen"></div>
  </div>
);

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return <PageLoader />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

const AppRoutes: React.FC = () => {
  const { user } = useAuth();
  const {
    hasStation,
    isSuperAdmin,
    stations,
    setSelectedStationId,
    selectedStationId,
    isAllStations,
  } = useStation();

  // Determine which dashboard to show based on role and station selection
  const getDashboardComponent = () => {
    // Super Admin with "All Stations" selected or no station selected
    if (isSuperAdmin && (isAllStations || !selectedStationId)) {
      return <ExecutiveDashboard />;
    }

    // Super Admin with a specific station selected
    if (isSuperAdmin && selectedStationId) {
      return <StationDashboard />;
    }

    // Regional Manager - show regional view
    if (user?.role === UserRole.REGIONAL_MANAGER) {
      return <RegionalDashboard />;
    }

    // Supervisor - show station view
    if (user?.role === UserRole.SUPERVISOR) {
      return <StationDashboard />;
    }

    // Default fallback
    return <ExecutiveDashboard />;
  };

  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected Routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={getDashboardComponent()} />
            <Route path="dashboard" element={getDashboardComponent()} />

            {/* Stations */}
            <Route path="stations">
              <Route index element={<StationList />} />
              <Route path=":id" element={<StationDetails />} />
              <Route path="management" element={<StationManagement />} />
            </Route>

            {/* Users */}
            <Route path="users">
              <Route index element={<UserManagement />} />
            </Route>

            {/* Sales */}
            <Route path="sales">
              <Route index element={<SalesManagement />} />
              <Route path="daily-report" element={<DailyReport />} />
              <Route path="reconciliation" element={<Reconciliation />} />
            </Route>

            {/* Purchases */}
            <Route path="purchases">
              <Route index element={<PurchaseOrders />} />
              <Route path="create" element={<CreatePurchaseOrder />} />
              <Route path=":id" element={<PurchaseOrderDetails />} />
            </Route>

            {/* Pumps */}
            <Route path="pumps">
              <Route index element={<PumpManagement />} />
              <Route path="readings" element={<PumpReadings />} />
              <Route path="dashboard" element={<PumpDashboard />} />
            </Route>

            {/* Expenses */}
            <Route path="expenses">
              <Route index element={<ExpenseManagement />} />
              <Route path="create" element={<CreateExpense />} />
              <Route path="approvals" element={<ExpenseApprovals />} />
            </Route>

            {/* Inventory */}
            <Route path="inventory">
              <Route index element={<TankMonitoring />} />
              <Route path="tanks" element={<TankManagement />} />
              <Route path="audit" element={<InventoryAudit />} />
              <Route path="movement" element={<ProductMovement />} />
            </Route>
            {/* Logistics */}
            <Route path="logistics">
              <Route index element={<LogisticsManagement />} />
              <Route path="tracking" element={<DeliveryTracking />} />
              <Route path="fleet" element={<FleetManagement />} />
            </Route>

            {/* Employees */}
            <Route path="employees">
              <Route index element={<EmployeeList />} />
              <Route path=":id" element={<EmployeeDetails />} />
              <Route path="management" element={<EmployeeManagement />} />
            </Route>

            {/* Reports */}
            <Route path="reports">
              <Route index element={<ReportsAnalytics />} />
              <Route path="generate" element={<ReportGenerator />} />
              <Route path="financial" element={<FinancialReports />} />
            </Route>

            {/* Analytics */}
            <Route path="analytics">
              <Route index element={<AnalyticsDashboard />} />
              <Route path="performance" element={<PerformanceMetrics />} />
              <Route path="trends" element={<TrendsAnalysis />} />
            </Route>

            {/* Settings */}
            <Route path="settings">
              <Route index element={<GeneralSettings />} />
              <Route path="user" element={<UserSettings />} />
              <Route path="system" element={<SystemSettings />} />
            </Route>

            {/* Support */}
            <Route path="support">
              <Route index element={<SupportTickets />} />
              <Route path="create" element={<CreateTicket />} />
              <Route path=":id" element={<TicketDetails />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default AppRoutes;
