import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi } from '../../api/analytics';
import {
  RefreshCw, Download, TrendingUp, TrendingDown,
  DollarSign, Users, Fuel, Package, Clock,
  ArrowUp, ArrowDown, Minus
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const PerformanceMetrics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [selectedStation, setSelectedStation] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });

  useEffect(() => {
    fetchMetrics();
  }, [selectedStation, dateRange]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const data = await analyticsApi.getPerformanceMetrics({
        stationId: selectedStation || user?.stationId,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
      });
      setMetrics(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      toast.error('Failed to load performance metrics');
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (value: number) => {
    if (value > 0) return <ArrowUp className="text-green-600" size={16} />;
    if (value < 0) return <ArrowDown className="text-red-600" size={16} />;
    return <Minus className="text-gray-400" size={16} />;
  };

  const getTrendColor = (value: number) => {
    if (value > 0) return 'text-green-600';
    if (value < 0) return 'text-red-600';
    return 'text-gray-400';
  };

  if (loading) return <Loader fullScreen text="Loading performance metrics..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Metrics</h1>
          <p className="text-gray-500">Track key performance indicators across stations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMetrics}
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

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Station</label>
            <select
              value={selectedStation}
              onChange={(e) => setSelectedStation(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value="">All Stations</option>
              <option value="alpha">Station Alpha</option>
              <option value="beta">Station Beta</option>
              <option value="gamma">Station Gamma</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
            <input
              type="date"
              value={dateRange.start.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
            <input
              type="date"
              value={dateRange.end.toISOString().split('T')[0]}
              onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Revenue</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics?.metrics?.totalSales || 0)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(metrics?.metrics?.growthRate || 0)}
              <span className={`text-sm font-medium ${getTrendColor(metrics?.metrics?.growthRate || 0)}`}>
                {Math.abs(metrics?.metrics?.growthRate || 0).toFixed(1)}%
              </span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">vs previous period</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatNumber(metrics?.metrics?.transactionCount || 0)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(8.5)}
              <span className="text-sm font-medium text-green-600">+8.5%</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">vs previous period</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg Transaction</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(metrics?.metrics?.averageTransactionValue || 0)}
              </p>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(5.1)}
              <span className="text-sm font-medium text-green-600">+5.1%</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">vs previous period</div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Profit Margin</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics?.metrics?.profitMargin?.toFixed(1) || '0'}%
              </p>
            </div>
            <div className="flex items-center gap-1">
              {getTrendIcon(2.3)}
              <span className="text-sm font-medium text-green-600">+2.3%</span>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-500">vs previous period</div>
        </div>
      </div>

      {/* Detailed Metrics Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Metrics</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Metric</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Value</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Change</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Daily Sales</td>
                <td className="py-3 px-4 text-right">{formatCurrency(12480500)}</td>
                <td className="py-3 px-4 text-right text-green-600">+14.2%</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Excellent</span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Fuel Volume</td>
                <td className="py-3 px-4 text-right">{formatNumber(7050)} L</td>
                <td className="py-3 px-4 text-right text-green-600">+12.4%</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Excellent</span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Transaction Count</td>
                <td className="py-3 px-4 text-right">{formatNumber(142)}</td>
                <td className="py-3 px-4 text-right text-green-600">+8.5%</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">Good</span>
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Average Transaction</td>
                <td className="py-3 px-4 text-right">{formatCurrency(87950)}</td>
                <td className="py-3 px-4 text-right text-green-600">+5.1%</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Excellent</span>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Customer Satisfaction</td>
                <td className="py-3 px-4 text-right">92.3%</td>
                <td className="py-3 px-4 text-right text-green-600">+2.1%</td>
                <td className="py-3 px-4 text-right">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Excellent</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PerformanceMetrics;