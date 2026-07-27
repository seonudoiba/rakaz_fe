import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useStation } from "../../contexts/StationContext";
import { stationsApi } from "../../api/stations";
import { salesApi } from "../../api/sales";
import { expensesApi } from "../../api/expenses";
import {
  DollarSign,
  Fuel,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Eye,
  X,
} from "lucide-react";
import { StatCard } from "../../components/cards/StatCard";
import SalesChart from "../../components/charts/SalesChart";
import { RevenueExpenseChart } from "../../components/charts/RevenueExpenseChart";
import { ProductPieChart } from "../../components/charts/ProductPieChart";
import {
  formatCurrency,
  formatNumber,
  formatDate,
  formatRelativeTime,
  formatDateTime,
} from "../../utils/formatters";
import Loader from "../../components/common/Loader";
import toast from "react-hot-toast";

type TimeRangeType =
  | "today"
  | "week"
  | "month"
  | "quarter"
  | "year"
  | "lastYear"
  | "custom"
  | "all";

const ExecutiveDashboard: React.FC = () => {
  const { user } = useAuth();
  const { selectedStationId, isSuperAdmin, isAllStations } = useStation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState<TimeRangeType>("all");
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [allActivities, setAllActivities] = useState<any[]>([]);
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split("T")[0],
  );
  const customDateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, selectedStationId, customStartDate, customEndDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customDateRef.current &&
        !customDateRef.current.contains(event.target as Node)
      ) {
        setShowCustomDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (timeRange) {
      case "today":
        startDate.setHours(0, 0, 0, 0);
        break;
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "quarter":
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "lastYear":
        startDate.setFullYear(startDate.getFullYear() - 2);
        endDate.setFullYear(endDate.getFullYear() - 1);
        break;
      case "custom":
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case "all":
      default:
        startDate = new Date(2020, 0, 1);
        break;
    }

    return { startDate, endDate };
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case "today": return "Today";
      case "week": return "This Week";
      case "month": return "This Month";
      case "quarter": return "This Quarter";
      case "year": return "This Year";
      case "lastYear": return "Last Year";
      case "custom": return `Custom: ${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
      case "all": return "All Time";
      default: return "All Time";
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoading(true);

      const stationsData = await stationsApi.getAll();
      setStations(stationsData);

      if (stationsData.length === 0) {
        setData(null);
        setLoading(false);
        return;
      }

      const { startDate, endDate } = getDateRange();

      let targetStations = stationsData;
      if (!isAllStations && selectedStationId) {
        targetStations = stationsData.filter((s) => s.id === selectedStationId);
      }

      // Fetch sales for all target stations
      const salesPromises = targetStations.map((station) =>
        salesApi.getStationSales(
          station.id,
          startDate.toISOString(),
          endDate.toISOString(),
        ),
      );
      const allSalesData = await Promise.all(salesPromises);

      // Aggregate data
      let totalSales = 0;
      let totalVolume = 0;
      let totalTransactions = 0;
      const salesByProduct: Record<string, number> = {};
      const stationPerformance: any[] = [];

      // Calculate daily sales for the chart
      const dailySalesMap: Record<
        string,
        { date: string; sales: number; volume: number; count: number }
      > = {};

      targetStations.forEach((station, index) => {
        const stationSales = allSalesData[index] || [];
        const stationTotal = stationSales.reduce(
          (sum: number, s: any) => sum + (s.totalAmount || 0),
          0,
        );
        const stationVolume = stationSales.reduce(
          (sum: number, s: any) => sum + (s.quantity || 0),
          0,
        );
        const stationTransactions = stationSales.length;

        totalSales += stationTotal;
        totalVolume += stationVolume;
        totalTransactions += stationTransactions;

        // Process daily sales
        stationSales.forEach((sale: any) => {
          const date = new Date(sale.createdAt).toISOString().split("T")[0];
          if (!dailySalesMap[date]) {
            dailySalesMap[date] = { date, sales: 0, volume: 0, count: 0 };
          }
          dailySalesMap[date].sales += sale.totalAmount || 0;
          dailySalesMap[date].volume += sale.quantity || 0;
          dailySalesMap[date].count += 1;

          const product = sale.productType || "Unknown";
          salesByProduct[product] =
            (salesByProduct[product] || 0) + (sale.totalAmount || 0);
        });

        stationPerformance.push({
          ...station,
          sales: stationTotal,
          volume: stationVolume,
          transactions: stationTransactions,
          target: 5000000,
        });
      });

      const dailySales = Object.values(dailySalesMap).sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      // Fetch expenses
      let totalExpenses = 0;
      try {
        const expensePromises = targetStations.map((station) =>
          expensesApi.getStationExpenses(station.id, {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        );
        const allExpensesData = await Promise.all(expensePromises);
        totalExpenses = allExpensesData.reduce(
          (sum, expenses) =>
            sum +
            (expenses || []).reduce(
              (s: number, e: any) => s + (e.amount || 0),
              0,
            ),
          0,
        );
      } catch (error) {
        console.warn("⚠️ Error fetching expenses:", error);
      }

      const activities = generateAllActivities(targetStations, allSalesData);
      setAllActivities(activities);

      const sortedStations = stationPerformance.sort(
        (a, b) => b.sales - a.sales,
      );

      setData({
        totalSales,
        totalVolume,
        totalTransactions,
        totalExpenses,
        stationCount: targetStations.length,
        activeManagers: targetStations.filter((s) => s.managerId).length,
        topStations: sortedStations.slice(0, 5),
        salesByProduct,
        dailySales, // ✅ FIXED: Added dailySales to the data object
        recentActivity: activities.slice(0, 5),
        profit: totalSales - totalExpenses,
        profitMargin:
          totalSales > 0
            ? ((totalSales - totalExpenses) / totalSales) * 100
            : 0,
      });
    } catch (error) {
      console.error("❌ Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const generateAllActivities = (stations: any[], salesData: any[][]) => {
    const activities = [];

    const allSales = salesData
      .flat()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );

    allSales.slice(0, 10).forEach((sale) => {
      const station = stations.find((s) => s.id === sale.stationId);
      activities.push({
        id: `sale-${sale.id}`,
        title: `💰 Sale: ${sale.quantity || 0}L ${sale.productType || "Unknown"}`,
        description: `${station?.name || "Unknown station"} - ${formatCurrency(sale.totalAmount || 0)}`,
        time: formatDateTime(sale.createdAt || new Date()),
        relativeTime: formatRelativeTime(sale.createdAt || new Date()),
        type: "sale" as const,
        station: station?.name || "Unknown",
        amount: sale.totalAmount || 0,
        details: {
          product: sale.productName || "Unknown",
          quantity: sale.quantity || 0,
          paymentMethod: sale.paymentMethod || "Unknown",
          customer: sale.customerName || "Walk-in",
        },
      });
    });

    return activities.sort(
      (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
    );
  };

  if (loading) return <Loader fullScreen text="Loading dashboard..." />;

  if (!data || (data.totalSales === 0 && data.stationCount === 0)) {
    return (
      <div className="text-center py-20">
        <div className="text-6xl mb-4">📊</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          No Data Available
        </h2>
        <p className="text-gray-500">
          No sales data found for the selected period.
          <br />
          Try changing the time range or check if there are any sales recorded.
        </p>
        <button
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors"
        >
          <RefreshCw size={16} className="inline mr-2" />
          Refresh
        </button>
      </div>
    );
  }

  const getStationDisplay = () => {
    if (isAllStations || !selectedStationId) return "All Stations";
    const station = stations.find((s) => s.id === selectedStationId);
    return station ? station.name : "All Stations";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Executive Command Center
          </h1>
          <p className="text-gray-500">
            Real-time oversight across all Rekaz Station operations
          </p>
          <div className="mt-1 text-sm text-petroleum-seagreen flex items-center gap-2">
            <span>📍 {getStationDisplay()}</span>
            <span>•</span>
            <span>{getTimeRangeLabel()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative" ref={customDateRef}>
            <select
              value={timeRange}
              onChange={(e) => {
                const value = e.target.value as TimeRangeType;
                setTimeRange(value);
                if (value === "custom") {
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Sales"
          value={formatCurrency(data?.totalSales || 0)}
          icon={DollarSign}
          subtitle={`${data?.totalTransactions || 0} transactions`}
          color="blue"
        />
        <StatCard
          title="Total Volume"
          value={`${formatNumber(data?.totalVolume || 0)} L`}
          icon={Fuel}
          subtitle="Fuel sold"
          color="green"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(data?.totalExpenses || 0)}
          icon={TrendingDown}
          subtitle={`${data?.stationCount || 0} stations`}
          color="red"
        />
        <StatCard
          title="Net Profit"
          value={formatCurrency(data?.profit || 0)}
          icon={TrendingUp}
          subtitle={`${data?.profitMargin?.toFixed(1) || 0}% margin`}
          color={data?.profit >= 0 ? "green" : "red"}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Sales Overview
            </h3>
          </div>
          <SalesChart data={data?.dailySales || []} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Sales by Product
            </h3>
          </div>
          <ProductPieChart data={data?.salesByProduct || {}} />
        </div>
      </div>

      {/* Top Performing Stations */}
      {data?.topStations?.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Top Performing Stations
            </h3>
            <button className="text-sm text-petroleum-seagreen hover:underline">
              View All
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">
                    Station Name
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">
                    Manager
                  </th>
                  <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">
                    Sales
                  </th>
                  <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">
                    Volume
                  </th>
                  <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.topStations?.map((station: any) => {
                  const percentage = (station.sales / station.target) * 100;
                  const status =
                    percentage >= 90
                      ? "Excellent"
                      : percentage >= 70
                        ? "Good"
                        : percentage >= 50
                          ? "Average"
                          : "Below Average";
                  const statusColor =
                    percentage >= 90
                      ? "text-green-600"
                      : percentage >= 70
                        ? "text-blue-600"
                        : percentage >= 50
                          ? "text-yellow-600"
                          : "text-red-600";

                  return (
                    <tr
                      key={station.id}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <div>
                          <p className="font-medium">{station.name}</p>
                          <p className="text-xs text-gray-500">
                            {station.code}
                          </p>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {station.manager?.firstName || "Not assigned"}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">
                        {formatCurrency(station.sales)}
                      </td>
                      <td className="py-3 px-4 text-right">
                        {formatNumber(station.volume)} L
                      </td>
                      <td className="py-3 px-4">
                        <span className={`font-medium ${statusColor}`}>
                          {status}
                        </span>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                          <div
                            className={`h-1.5 rounded-full ${percentage >= 90 ? "bg-green-500" : percentage >= 70 ? "bg-blue-500" : percentage >= 50 ? "bg-yellow-500" : "bg-red-500"}`}
                            style={{ width: `${Math.min(percentage, 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Activity Log */}
      {data?.recentActivity?.length > 0 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Activity
            </h3>
            <button
              onClick={() => setShowAllLogs(true)}
              className="flex items-center gap-1 text-sm text-petroleum-seagreen hover:underline"
            >
              <Eye size={16} />
              View All Logs
            </button>
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {data?.recentActivity
              ?.slice(0, 10)
              .map((activity: any, index: number) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <div
                    className={`w-2 h-2 mt-2 rounded-full ${
                      activity.type === "sale"
                        ? "bg-green-500"
                        : activity.type === "expense"
                          ? "bg-red-500"
                          : activity.type === "inventory"
                            ? "bg-yellow-500"
                            : activity.type === "delivery"
                              ? "bg-blue-500"
                              : "bg-purple-500"
                    }`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-sm text-gray-500">
                      {activity.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {activity.relativeTime}
                      </span>
                      <span className="text-xs text-gray-400">•</span>
                      <span className="text-xs text-gray-400">
                        {activity.station}
                      </span>
                      {activity.amount && (
                        <>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs font-medium text-petroleum-seagreen">
                            {formatCurrency(activity.amount)}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveDashboard;