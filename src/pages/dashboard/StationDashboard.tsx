import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStation } from '../../contexts/StationContext';
import { stationsApi } from '../../api/stations';
import { salesApi } from '../../api/sales';
import { pumpsApi } from '../../api/pumps';
import { expensesApi } from '../../api/expenses';
import { inventoryApi } from '../../api/inventory';
import { 
  DollarSign, 
  Fuel, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  CreditCard,
  Wallet,
  Banknote,
  Truck,
  ShoppingCart,
  Package,
  Users,
  Settings,
  HelpCircle,
  BarChart3,
  Activity,
  Building,
  Layers,
  X
} from 'lucide-react';
import { StatCard } from '../../components/cards/StatCard';
import { TankCard } from '../../components/cards/TankCard';
import SalesChart from '../../components/charts/SalesChart';
import ExpenseBreakdownChart from '../../components/charts/ExpenseBreakdownChart';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

type TimeRangeType = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'lastYear' | 'custom' | 'all';

const StationDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedStationId, isSuperAdmin, isAllStations, stations, loading: stationLoading } = useStation();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [timeRange, setTimeRange] = useState<TimeRangeType>('all');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const customDateRef = useRef<HTMLDivElement>(null);
  
  // Use refs to track fetch state - FIXED: Use number | undefined instead of NodeJS.Timeout
  const isFetching = useRef<boolean>(false);
  const fetchTimeoutRef = useRef<number | undefined>(undefined);
  const lastFetchParams = useRef<string>('');

  // Click outside handler for custom date picker
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customDateRef.current && !customDateRef.current.contains(event.target as Node)) {
        setShowCustomDatePicker(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getDateRange = useCallback(() => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'lastYear':
        startDate.setFullYear(startDate.getFullYear() - 2);
        endDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'all':
      default:
        startDate = new Date(2020, 0, 1);
        break;
    }

    return { startDate, endDate };
  }, [timeRange, customStartDate, customEndDate]);

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      case 'lastYear': return 'Last Year';
      case 'custom': return `Custom: ${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
      case 'all': return 'All Time';
      default: return 'All Time';
    }
  };

  const fetchDashboardData = useCallback(async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching.current) {
      console.log('⏳ [StationDashboard] Fetch already in progress, skipping...');
      return;
    }

    // Prevent fetching if no station is selected
    if (!selectedStationId && !isAllStations) {
      console.log('ℹ️ [StationDashboard] No station selected, skipping fetch');
      setLoading(false);
      return;
    }

    // Create a unique key for this request to prevent duplicates
    const requestKey = `${selectedStationId}-${timeRange}-${customStartDate}-${customEndDate}`;
    if (requestKey === lastFetchParams.current) {
      console.log('🔄 [StationDashboard] Same request, skipping duplicate...');
      return;
    }
    lastFetchParams.current = requestKey;

    try {
      isFetching.current = true;
      setLoading(true);

      const { startDate, endDate } = getDateRange();
      
      let data;
      
      if (isAllStations && isSuperAdmin) {
        // Fetch data from all stations
        const allStations = await stationsApi.getAll();
        
        const allSalesPromises = allStations.map(station =>
          salesApi.getStationSales(station.id, startDate.toISOString(), endDate.toISOString())
        );
        const allSalesData = await Promise.all(allSalesPromises);
        const allTransactions = allSalesData.flat();
        
        const expensePromises = allStations.map(station =>
          expensesApi.getStationExpenses(station.id, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          })
        );
        const allExpensesData = await Promise.all(expensePromises);
        const allExpenses = allExpensesData.flat();
        
        let allPumps = [];
        try {
          const pumpsPromises = allStations.map(station =>
            pumpsApi.getStationPumps(station.id)
          );
          const pumpsData = await Promise.all(pumpsPromises);
          allPumps = pumpsData.flat();
        } catch (error) {
          console.warn('Error fetching pumps:', error);
        }
        
        let allTanks = [];
        try {
          const tankPromises = allStations.map(station =>
            inventoryApi.getTankMonitoring(station.id)
          );
          const tanksData = await Promise.all(tankPromises);
          allTanks = tanksData.flatMap((t: any) => t.tanks || []);
        } catch (error) {
          console.warn('Error fetching tanks:', error);
        }
        
        data = {
          station: { name: 'All Stations', code: 'ALL' },
          sales: {
            totalSales: allTransactions.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0),
            totalVolume: allTransactions.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0),
            transactionCount: allTransactions.length,
            transactions: allTransactions
          },
          pumps: allPumps,
          expenses: allExpenses,
          inventory: {
            tanks: allTanks
          }
        };
      } else if (selectedStationId) {
        // Fetch data for specific station
        const [stationData, salesData, pumpsData, expensesData, inventoryData] = await Promise.all([
          stationsApi.getOne(selectedStationId),
          salesApi.getStationSales(selectedStationId, startDate.toISOString(), endDate.toISOString()),
          pumpsApi.getStationPumps(selectedStationId),
          expensesApi.getStationExpenses(selectedStationId, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
          inventoryApi.getTankMonitoring(selectedStationId).catch(() => ({ tanks: [] })),
        ]);

        data = {
          station: stationData,
          sales: {
            totalSales: salesData.reduce((sum: number, s: any) => sum + (s.totalAmount || 0), 0),
            totalVolume: salesData.reduce((sum: number, s: any) => sum + (s.quantity || 0), 0),
            transactionCount: salesData.length,
            transactions: salesData
          },
          pumps: pumpsData,
          expenses: expensesData,
          inventory: inventoryData || { tanks: [] },
        };
      } else {
        data = null;
      }

      setDashboardData(data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Only show toast for errors, not for rate limiting
      if (error instanceof Error && !error.message.includes('Too many requests')) {
        toast.error('Failed to load dashboard data');
      }
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  }, [selectedStationId, timeRange, customStartDate, customEndDate, isAllStations, isSuperAdmin, getDateRange]);

  // Use a debounced fetch
  useEffect(() => {
    // Clear any pending timeout
    if (fetchTimeoutRef.current) {
      clearTimeout(fetchTimeoutRef.current);
      fetchTimeoutRef.current = undefined;
    }

    // Don't fetch while stations are loading
    if (stationLoading) {
      return;
    }

    // Add a delay to prevent rapid successive calls
    fetchTimeoutRef.current = window.setTimeout(() => {
      fetchDashboardData();
      fetchTimeoutRef.current = undefined;
    }, 500);

    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = undefined;
      }
    };
  }, [fetchDashboardData, stationLoading]);

  const getStationDisplay = () => {
    if (isAllStations && isSuperAdmin) return 'All Stations';
    const station = stations.find(s => s.id === selectedStationId);
    return station ? station.name : 'No Station';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-petroleum-seagreen"></div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">⛽</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">No Station Selected</h2>
        <p className="text-gray-500">Please select a station from the dropdown above.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Station Dashboard</h1>
          <p className="text-gray-500">Comprehensive overview of station operations</p>
          <div className="mt-1 text-sm text-petroleum-seagreen flex items-center gap-2">
            {isAllStations && isSuperAdmin ? (
              <Layers size={16} />
            ) : (
              <Building size={16} />
            )}
            <span>{getStationDisplay()}</span>
            <span>•</span>
            <span>{getTimeRangeLabel()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Time Range Dropdown */}
          <div className="relative" ref={customDateRef}>
            <select
              value={timeRange}
              onChange={(e) => {
                const value = e.target.value as TimeRangeType;
                setTimeRange(value);
                if (value === 'custom') {
                  setShowCustomDatePicker(true);
                } else {
                  setShowCustomDatePicker(false);
                }
              }}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen bg-white min-w-[140px]"
            >
              <option value="all">📊 All Time</option>
              <option value="today">📅 Today</option>
              <option value="week">📅 This Week</option>
              <option value="month">📅 This Month</option>
              <option value="quarter">📅 This Quarter</option>
              <option value="year">📅 This Year</option>
              <option value="lastYear">📅 Last Year</option>
              <option value="custom">📅 Custom Range</option>
            </select>
          </div>

          {/* Custom Date Range Picker */}
          {showCustomDatePicker && (
            <div className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                />
              </div>
              <button
                onClick={() => {
                  setShowCustomDatePicker(false);
                  fetchDashboardData();
                }}
                className="px-3 py-1 bg-petroleum-seagreen text-petroleum-dark text-sm rounded hover:bg-petroleum-seagreen/90 transition-colors"
              >
                Apply
              </button>
              <button
                onClick={() => setShowCustomDatePicker(false)}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <button 
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(dashboardData?.sales?.totalSales || 0)}
          icon={DollarSign}
          subtitle={`${dashboardData?.sales?.transactionCount || 0} transactions`}
          color="blue"
        />
        <StatCard
          title="Total Volume"
          value={`${formatNumber(dashboardData?.sales?.totalVolume || 0)} L`}
          icon={Fuel}
          subtitle="Total fuel sold"
          color="green"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(dashboardData?.expenses?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0)}
          icon={TrendingDown}
          subtitle="Total operational costs"
          color="red"
        />
        <StatCard
          title="Active Pumps"
          value={dashboardData?.pumps?.filter((p: any) => p.isActive).length || 0}
          icon={Activity}
          subtitle={`${dashboardData?.pumps?.length || 0} total pumps`}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <button className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-50 rounded-lg">
            <ShoppingCart className="text-blue-600" size={24} />
          </div>
          <span className="text-sm font-medium">New Sale</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <div className="p-3 bg-green-50 rounded-lg">
            <Package className="text-green-600" size={24} />
          </div>
          <span className="text-sm font-medium">Purchase Order</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <div className="p-3 bg-yellow-50 rounded-lg">
            <Wallet className="text-yellow-600" size={24} />
          </div>
          <span className="text-sm font-medium">Add Expense</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <div className="p-3 bg-purple-50 rounded-lg">
            <BarChart3 className="text-purple-600" size={24} />
          </div>
          <span className="text-sm font-medium">Analytics</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <div className="p-3 bg-orange-50 rounded-lg">
            <Users className="text-orange-600" size={24} />
          </div>
          <span className="text-sm font-medium">Employees</span>
        </button>
        <button className="flex flex-col items-center gap-2 p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow">
          <div className="p-3 bg-red-50 rounded-lg">
            <HelpCircle className="text-red-600" size={24} />
          </div>
          <span className="text-sm font-medium">Support</span>
        </button>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Sales Overview</h3>
            <button className="text-sm text-petroleum-seagreen hover:underline">View Details</button>
          </div>
          <SalesChart data={dashboardData?.sales?.transactions || []} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Expense Breakdown</h3>
            <button className="text-sm text-petroleum-seagreen hover:underline">View Details</button>
          </div>
          <ExpenseBreakdownChart expenses={dashboardData?.expenses || []} />
        </div>
      </div>

      {/* Tank Monitoring */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Tank Monitoring</h3>
          <span className="text-xs text-gray-500">Live telemetry from underground storage</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboardData?.inventory?.tanks?.length > 0 ? (
            dashboardData.inventory.tanks.map((tank: any) => (
              <TankCard key={tank.id} tank={tank} />
            ))
          ) : (
            <p className="text-gray-500 col-span-3 text-center py-8">No tanks found</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default StationDashboard;