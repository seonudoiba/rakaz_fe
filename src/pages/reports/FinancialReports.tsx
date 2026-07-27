import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportsApi } from '../../api/reports';
import {
  RefreshCw, Download, Calendar, Filter,
  DollarSign, TrendingUp, TrendingDown,
  FileText, Printer, ChevronDown
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import { RevenueExpenseChart } from '../../components/charts/RevenueExpenseChart';
import { ExpenseBreakdownChart } from '../../components/charts/ExpenseBreakdownChart';
import toast from 'react-hot-toast';

const FinancialReports: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('month');
  const [reportData, setReportData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchFinancialData();
  }, [period]);

  const fetchFinancialData = async () => {
    try {
      setLoading(true);
      const stationId = user?.stationId;
      
      const endDate = new Date();
      const startDate = new Date();
      if (period === 'month') startDate.setMonth(startDate.getMonth() - 1);
      else if (period === 'quarter') startDate.setMonth(startDate.getMonth() - 3);
      else if (period === 'year') startDate.setFullYear(startDate.getFullYear() - 1);

      const data = await reportsApi.generateFinancialReport({
        stationId,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      
      setReportData(data);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching financial data:', error);
      toast.error('Failed to load financial data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading financial reports..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
          <p className="text-gray-500">Comprehensive financial overview and analysis</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          >
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
          <button
            onClick={fetchFinancialData}
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

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalRevenue)}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <DollarSign className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(summary.totalExpenses)}</p>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <TrendingDown className="text-red-600" size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Net Profit</p>
                <p className={`text-2xl font-bold ${summary.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary.profit)}
                </p>
              </div>
              <div className={`p-3 rounded-lg ${summary.profit >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                <TrendingUp className={summary.profit >= 0 ? 'text-green-600' : 'text-red-600'} size={24} />
              </div>
            </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Profit Margin</p>
                <p className={`text-2xl font-bold ${summary.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary.profitMargin?.toFixed(1) || '0'}%
                </p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <FileText className="text-purple-600" size={24} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
          <RevenueExpenseChart data={reportData?.dailyBreakdown || []} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <ExpenseBreakdownChart expenses={reportData?.expensesByCategory || []} />
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Category</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Revenue</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Expenses</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Profit/Loss</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Margin</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Sales</td>
                <td className="py-3 px-4 text-right">{formatCurrency(summary?.totalRevenue || 0)}</td>
                <td className="py-3 px-4 text-right">-</td>
                <td className="py-3 px-4 text-right text-green-600">{formatCurrency(summary?.totalRevenue || 0)}</td>
                <td className="py-3 px-4 text-right">100%</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Operations</td>
                <td className="py-3 px-4 text-right">-</td>
                <td className="py-3 px-4 text-right">{formatCurrency(summary?.totalExpenses * 0.6 || 0)}</td>
                <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(summary?.totalExpenses * 0.6 || 0)}</td>
                <td className="py-3 px-4 text-right">-</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Administrative</td>
                <td className="py-3 px-4 text-right">-</td>
                <td className="py-3 px-4 text-right">{formatCurrency(summary?.totalExpenses * 0.3 || 0)}</td>
                <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(summary?.totalExpenses * 0.3 || 0)}</td>
                <td className="py-3 px-4 text-right">-</td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Logistics</td>
                <td className="py-3 px-4 text-right">-</td>
                <td className="py-3 px-4 text-right">{formatCurrency(summary?.totalExpenses * 0.1 || 0)}</td>
                <td className="py-3 px-4 text-right text-red-600">-{formatCurrency(summary?.totalExpenses * 0.1 || 0)}</td>
                <td className="py-3 px-4 text-right">-</td>
              </tr>
              <tr className="bg-gray-50 font-bold">
                <td className="py-3 px-4">Total</td>
                <td className="py-3 px-4 text-right">{formatCurrency(summary?.totalRevenue || 0)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(summary?.totalExpenses || 0)}</td>
                <td className={`py-3 px-4 text-right ${summary?.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(summary?.profit || 0)}
                </td>
                <td className={`py-3 px-4 text-right ${summary?.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {summary?.profitMargin?.toFixed(1) || '0'}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;