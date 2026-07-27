import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { stationsApi } from '../../api/stations';
import { salesApi } from '../../api/sales';
import { analyticsApi } from '../../api/analytics';
import {
  DollarSign, Fuel, TrendingUp, TrendingDown, RefreshCw,
  MapPin, Users, ChevronRight, BarChart3, AlertCircle,
  Building, Calendar, Clock
} from 'lucide-react';
import { StatCard } from '../../components/cards/StatCard';
import SalesChart from '../../components/charts/SalesChart';
import { ProductPieChart } from '../../components/charts/ProductPieChart';
import { formatCurrency, formatNumber, formatDate, formatRelativeTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const RegionalDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [timeRange, setTimeRange] = useState('today');
  const [selectedStation, setSelectedStation] = useState<string>('all');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange, selectedStation]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Get stations in region
      const regionStations = await stationsApi.getAll(user?.regionId);
      setStations(regionStations);

      // Fetch sales data for each station
      const today = new Date();
      const salesPromises = regionStations.map(station =>
        salesApi.getDailyReport(station.id, today.toISOString().split('T')[0])
      );
      const salesData = await Promise.all(salesPromises);

      // Get station performance metrics
      const metrics = await analyticsApi.getPerformanceMetrics({
        stationId: regionStations[0]?.id,
        startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        endDate: new Date().toISOString(),
      });

      // Aggregate data
      const totalSales = salesData.reduce((sum, s) => sum + s.totalSales, 0);
      const totalVolume = salesData.reduce((sum, s) => sum + s.totalVolume, 0);
      const totalTransactions = salesData.reduce((sum, s) => sum + s.transactionCount, 0);

      // Calculate station performance
      const stationPerformance = regionStations.map((station, index) => {
        const sales = salesData[index]?.totalSales || 0;
        const target = 5000000;
        const percentage = (sales / target) * 100;
        let performance = 'Below Average';
        let color = 'text-red-600';
        if (percentage >= 90) { performance = 'Excellent'; color = 'text-green-600'; }
        else if (percentage >= 70) { performance = 'Good'; color = 'text-blue-600'; }
        else if (percentage >= 50) { performance = 'Average'; color = 'text-yellow-600'; }
        
        return {
          ...station,
          sales,
          volume: salesData[index]?.totalVolume || 0,
          transactions: salesData[index]?.transactionCount || 0,
          target,
          percentage,
          performance,
          performanceColor: color,
        };
      });

      setData({
        totalSales,
        totalVolume,
        totalTransactions,
        stationCount: regionStations.length,
        activeManagers: regionStations.filter(s => s.managerId).length,
        metrics,
        stationPerformance,
        salesByProduct: salesData.reduce((acc, s) => {
          s.transactions.forEach((t: any) => {
            const product = t.productType;
            acc[product] = (acc[product] || 0) + t.totalAmount;
          });
          return acc;
        }, {}),
        recentActivities: generateRecentActivities(regionStations, salesData),
      });
    } catch (error) {
      console.error('Error fetching regional dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const generateRecentActivities = (stations: any[], salesData: any[]) => {
    const activities = [];
    
    // Add sale activities
    for (let i = 0; i < Math.min(3, stations.length); i++) {
      const station = stations[i];
      const sales = salesData[i]?.totalSales || 0;
      if (sales > 0) {
        activities.push({
          title: `Large Deposit Confirmed`,
          description: `${station.name} deposited ${formatCurrency(sales)} (Cash & POS)`,
          time: '10 minutes ago',
          type: 'sale',
          station: station.name,
        });
      }
    }

    // Add inventory alerts
    activities.push({
      title: 'Low Stock Alert: AGO',
      description: 'Kano Depot reports Diesel stock at 12% capacity. Reorder suggested.',
      time: '1 hour ago',
      type: 'inventory',
      station: 'Kano Depot',
    });

    activities.push({
      title: 'New Manager Report',
      description: 'Musa (Kano) submitted the EOD pump reconciliation report.',
      time: '2 hours ago',
      type: 'approval',
      station: 'Kano Station',
    });

    return activities;
  };

  if (loading) return <Loader fullScreen text="Loading regional dashboard..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regional Dashboard</h1>
          <p className="text-gray-500">Overview of all stations in your region</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Region Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Stations"
          value={data?.stationCount || 0}
          icon={MapPin}
          subtitle={`${data?.activeManagers || 0} active managers`}
          color="blue"
        />
        <StatCard
          title="Today's Revenue"
          value={formatCurrency(data?.totalSales || 0)}
          icon={DollarSign}
          subtitle={`${formatNumber(data?.totalTransactions || 0)} transactions`}
          color="green"
        />
        <StatCard
          title="Fuel Volume"
          value={`${formatNumber(data?.totalVolume || 0)} L`}
          icon={Fuel}
          subtitle="Total volume sold today"
          color="purple"
        />
        <StatCard
          title="Avg Per Station"
          value={formatCurrency((data?.totalSales || 0) / (data?.stationCount || 1))}
          icon={TrendingUp}
          subtitle="Average daily sales"
          color="yellow"
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales Trends (Last 7 Days)</h3>
            <button className="text-sm text-petroleum-seagreen hover:underline">View Details</button>
          </div>
          <SalesChart data={[
            { date: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], sales: 850000, volume: 4200 },
            { date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], sales: 920000, volume: 4800 },
            { date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], sales: 780000, volume: 3900 },
            { date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], sales: 1100000, volume: 5500 },
            { date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], sales: 950000, volume: 4700 },
            { date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], sales: 880000, volume: 4300 },
            { date: new Date().toISOString().split('T')[0], sales: 12480500, volume: 7050 },
          ]} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales by Product</h3>
            <button className="text-sm text-petroleum-seagreen hover:underline">View Details</button>
          </div>
          <ProductPieChart data={data?.salesByProduct || {}} />
        </div>
      </div>

      {/* Station Performance */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Station Performance</h3>
          <button className="text-sm text-petroleum-seagreen hover:underline">View All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Station</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Manager</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Today's Sales</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Volume</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Transactions</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Performance</th>
              </tr>
            </thead>
            <tbody>
              {data?.stationPerformance?.map((station: any) => (
                <tr key={station.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{station.name}</p>
                      <p className="text-xs text-gray-500">{station.code}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">{station.manager?.firstName || 'Not assigned'}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatCurrency(station.sales)}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(station.volume)} L</td>
                  <td className="py-3 px-4 text-right">{station.transactions}</td>
                  <td className="py-3 px-4">
                    <span className={`font-medium ${station.performanceColor}`}>
                      {station.performance}
                    </span>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                      <div 
                        className={`h-1.5 rounded-full ${station.percentage >= 90 ? 'bg-green-500' : station.percentage >= 70 ? 'bg-blue-500' : station.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                        style={{ width: `${Math.min(station.percentage, 100)}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {data?.recentActivities?.map((activity: any, index: number) => (
              <div key={index} className="flex items-start gap-3">
                <div className={`w-2 h-2 mt-2 rounded-full ${
                  activity.type === 'sale' ? 'bg-green-500' :
                  activity.type === 'expense' ? 'bg-red-500' :
                  activity.type === 'inventory' ? 'bg-yellow-500' :
                  activity.type === 'delivery' ? 'bg-blue-500' :
                  'bg-purple-500'
                }`} />
                <div>
                  <p className="text-sm font-medium">{activity.title}</p>
                  <p className="text-sm text-gray-500">{activity.description}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">{activity.time}</span>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-400">{activity.station}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button className="mt-4 text-sm text-petroleum-seagreen hover:underline">View All Logs</button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <BarChart3 size={18} className="text-petroleum-seagreen" />
              <span className="text-sm font-medium">Analytics</span>
            </button>
            <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users size={18} className="text-blue-600" />
              <span className="text-sm font-medium">Managers</span>
            </button>
            <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <AlertCircle size={18} className="text-red-600" />
              <span className="text-sm font-medium">Alerts</span>
            </button>
            <button className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <TrendingUp size={18} className="text-green-600" />
              <span className="text-sm font-medium">Reports</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegionalDashboard;