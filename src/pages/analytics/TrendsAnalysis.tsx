import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { analyticsApi } from '../../api/analytics';
import {
  RefreshCw, Download, TrendingUp, TrendingDown,
  Calendar, Filter, ChevronDown, Activity
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SalesChart from '../../components/charts/SalesChart';
import toast from 'react-hot-toast';

const TrendsAnalysis: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metric, setMetric] = useState('sales');
  const [timeRange, setTimeRange] = useState('30d');
  const [trends, setTrends] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);

  useEffect(() => {
    fetchTrendsData();
  }, [metric, timeRange]);

  const fetchTrendsData = async () => {
    try {
      setLoading(true);
      const stationId = user?.stationId;
      
      const endDate = new Date();
      const startDate = new Date();
      if (timeRange === '7d') startDate.setDate(startDate.getDate() - 7);
      else if (timeRange === '30d') startDate.setDate(startDate.getDate() - 30);
      else if (timeRange === '90d') startDate.setDate(startDate.getDate() - 90);
      
      const [trendsData, forecastData] = await Promise.all([
        analyticsApi.getTrendsAnalysis({
          stationId,
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          metric,
        }),
        analyticsApi.getPredictiveAnalytics({
          stationId,
          metric,
        }),
      ]);
      
      setTrends(trendsData);
      setForecast(forecastData);
    } catch (error) {
      console.error('Error fetching trends data:', error);
      toast.error('Failed to load trends data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading trends analysis..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Trends Analysis</h1>
          <p className="text-gray-500">Analyze patterns and predict future performance</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchTrendsData}
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

      {/* Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Metric</label>
            <select
              value={metric}
              onChange={(e) => setMetric(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value="sales">Sales Revenue</option>
              <option value="volume">Fuel Volume</option>
              <option value="transactions">Transaction Count</option>
              <option value="profit">Profit</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            {metric.charAt(0).toUpperCase() + metric.slice(1)} Trend
          </h3>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Activity size={16} />
            <span>Mean: {formatNumber(trends?.statistics?.mean || 0)}</span>
          </div>
        </div>
        <SalesChart data={trends?.dataPoints || []} />
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Mean</p>
          <p className="text-xl font-bold text-gray-900">{formatNumber(trends?.statistics?.mean || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Median</p>
          <p className="text-xl font-bold text-gray-900">{formatNumber(trends?.statistics?.median || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Min</p>
          <p className="text-xl font-bold text-red-600">{formatNumber(trends?.statistics?.min || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Max</p>
          <p className="text-xl font-bold text-green-600">{formatNumber(trends?.statistics?.max || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Std Dev</p>
          <p className="text-xl font-bold text-blue-600">{formatNumber(trends?.statistics?.standardDeviation || 0)}</p>
        </div>
      </div>

      {/* Forecast */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Forecast</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {forecast?.forecast?.slice(0, 3).map((item: any, index: number) => (
            <div key={index} className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-500">{formatDate(item.date)}</p>
              <p className="text-2xl font-bold text-gray-900">
                {metric === 'sales' ? formatCurrency(item.predictedRevenue) : formatNumber(item.predictedRevenue)}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <span>Range: {formatNumber(item.confidenceLower)} - {formatNumber(item.confidenceUpper)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrendsAnalysis;