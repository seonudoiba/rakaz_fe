import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi } from '../../api/analytics';
import {
  RefreshCw, Download, TrendingUp, TrendingDown,
  DollarSign, Users, Fuel, Package,
  BarChart3, PieChart, Activity, Clock
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import { StatCard } from '../../components/cards/StatCard';
import SalesChart from '../../components/charts/SalesChart';
import { ProductPieChart } from '../../components/charts/ProductPieChart';
import toast from 'react-hot-toast';
import { useStation } from '../../contexts/StationContext';


const AnalyticsDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [metrics, setMetrics] = useState<any>(null);
  const [trends, setTrends] = useState<any>(null);
  const [comparison, setComparison] = useState<any>(null);
  const { selectedStationId, isSuperAdmin, stations, setSelectedStationId, hasStation } = useStation();

  useEffect(() => {
    fetchAnalyticsData();
  }, [timeRange]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      const stationId = user?.stationId;
      
      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
      else if (timeRange === '90d') startDate.setDate(startDate.getDate() - 90);
      
      const [metricsData, trendsData] = await Promise.all([
        analyticsApi.getPerformanceMetrics({
          stationId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
        analyticsApi.getTrendsAnalysis({
          stationId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          metric: 'sales',
        }),
      ]);
      
      setMetrics(metricsData);
      setTrends(trendsData);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading analytics..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-500">Comprehensive business intelligence and insights</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button
            onClick={fetchAnalyticsData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Revenue"
          value={formatCurrency(metrics?.metrics?.totalSales || 0)}
          icon={DollarSign}
          trend={metrics?.metrics?.growthRate || 0}
          trendLabel="vs previous period"
          color="blue"
        />
        <StatCard
          title="Total Volume"
          value={`${formatNumber(metrics?.metrics?.totalVolume || 0)} L`}
          icon={Fuel}
          subtitle="Fuel sold"
          color="green"
        />
        <StatCard
          title="Avg Transaction"
          value={formatCurrency(metrics?.metrics?.averageTransactionValue || 0)}
          icon={Activity}
          subtitle="Per transaction"
          color="purple"
        />
        <StatCard
          title="Active Stations"
          value={comparison?.stations?.length || 0}
          icon={Users}
          subtitle="In your region"
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trend</h3>
            <button className="text-sm text-petroleum-seagreen hover:underline">View Details</button>
          </div>
          <SalesChart data={trends?.dataPoints || []} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Product Distribution</h3>
            <button className="text-sm text-petroleum-seagreen hover:underline">View Details</button>
          </div>
          <ProductPieChart data={{
            'PMS': 8400000,
            'AGO': 2100000,
            'LPG': 1200000,
            'Lubricants': 700000,
          }} />
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance KPIs</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Revenue Growth</span>
              <span className="text-sm font-bold text-green-600">+14.2%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Transaction Growth</span>
              <span className="text-sm font-bold text-green-600">+8.5%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Customer Retention</span>
              <span className="text-sm font-bold text-blue-600">92.3%</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Avg Transaction Value</span>
              <span className="text-sm font-bold text-purple-600">+5.1%</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Products</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Premium Motor Spirit</span>
              <span className="text-sm font-bold">42,500 L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">AGO Diesel</span>
              <span className="text-sm font-bold">18,200 L</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">LPG Gas</span>
              <span className="text-sm font-bold">8,100 KG</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Lubricants</span>
              <span className="text-sm font-bold">2,100 Units</span>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Insights</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-2 rounded-full bg-green-500" />
              <p className="text-sm text-gray-600">Peak sales hours: 10 AM - 2 PM</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
              <p className="text-sm text-gray-600">Best performing station: Alpha-01</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-2 rounded-full bg-yellow-500" />
              <p className="text-sm text-gray-600">Inventory optimization needed</p>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2 h-2 mt-2 rounded-full bg-purple-500" />
              <p className="text-sm text-gray-600">Cash payments: 45% of transactions</p>
            </div>
          </div>
        </div>
      </div>

      {/* Predictive Analytics */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Predictive Analytics</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-gray-600">Forecasted Revenue</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(24500000)}</p>
            <p className="text-xs text-gray-500">Next 30 days</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-gray-600">Expected Volume</p>
            <p className="text-2xl font-bold text-green-600">{formatNumber(135000)} L</p>
            <p className="text-xs text-gray-500">Next 30 days</p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <p className="text-sm text-gray-600">Stock Reorder</p>
            <p className="text-2xl font-bold text-purple-600">3 Products</p>
            <p className="text-xs text-gray-500">Due in 5 days</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;