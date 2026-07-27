import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportsApi } from '../../api/reports';
import { analyticsApi } from '../../api/analytics';
import {
  RefreshCw, Download, Calendar, Filter,
  FileText, BarChart3, PieChart, TrendingUp,
  DollarSign, Fuel, Package, Users,
  ChevronDown, Printer, Mail
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SalesChart from '../../components/charts/SalesChart';
import { RevenueExpenseChart } from '../../components/charts/RevenueExpenseChart';
import { ProductPieChart } from '../../components/charts/ProductPieChart';
import { ExpenseBreakdownChart } from '../../components/charts/ExpenseBreakdownChart';
import toast from 'react-hot-toast';

const ReportsAnalytics: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [reportType, setReportType] = useState('sales');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [reportData, setReportData] = useState<any>(null);
  const [summary, setSummary] = useState<any>(null);

  useEffect(() => {
    fetchReportData();
  }, [reportType, dateRange]);

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const stationId = user?.stationId;
      
      let data;
      switch (reportType) {
        case 'sales':
          data = await reportsApi.generateSalesReport({
            stationId,
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString(),
          });
          break;
        case 'financial':
          data = await reportsApi.generateFinancialReport({
            stationId,
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString(),
          });
          break;
        case 'inventory':
          data = await reportsApi.generateInventoryReport({
            stationId,
          });
          break;
        default:
          data = await reportsApi.generateSalesReport({
            stationId,
            startDate: dateRange.start.toISOString(),
            endDate: dateRange.end.toISOString(),
          });
      }
      
      setReportData(data);
      setSummary(data.summary);
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast.error('Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: string) => {
    try {
      await reportsApi.exportReport(reportType, reportData, format);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  if (loading) return <Loader fullScreen text="Loading report data..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-500">Real-time financial performance and operational audit data</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleExport('pdf')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Printer size={16} />
            Print
          </button>
          <button
            onClick={() => handleExport('excel')}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Download size={16} />
            Export
          </button>
          <button
            onClick={fetchReportData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </div>

      {/* Report Controls */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value="sales">Sales Report</option>
              <option value="financial">Financial Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="station">Station Report</option>
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
          <div className="flex items-end">
            <button
              onClick={fetchReportData}
              className="px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="text-blue-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalRevenue || summary.totalSales || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-50 rounded-lg">
                <FileText className="text-red-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(summary.totalExpenses || 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="text-green-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Profit Margin</p>
                <p className="text-2xl font-bold text-green-600">
                  {summary.profitMargin?.toFixed(1) || '0'}%
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Package className="text-purple-600" size={20} />
              </div>
              <div>
                <p className="text-sm text-gray-500">Transactions</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.transactionCount || 0}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Trend</h3>
          <SalesChart data={reportData?.dailyBreakdown || []} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue vs Expenses</h3>
          <RevenueExpenseChart data={reportData?.dailyBreakdown || []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales by Product</h3>
          <ProductPieChart data={reportData?.productBreakdown?.reduce((acc: any, p: any) => {
            acc[p.productName] = p._sum.totalAmount;
            return acc;
          }, {}) || {}} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Expense Breakdown</h3>
          <ExpenseBreakdownChart expenses={reportData?.expensesByCategory || []} />
        </div>
      </div>

      {/* Recent Reports */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Report Name</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Station</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Date Generated</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Status</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Monthly Fuel Reconciliation</td>
                <td className="py-3 px-4">Station A-01</td>
                <td className="py-3 px-4">{formatDate(new Date())}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Completed</span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-sm text-petroleum-seagreen hover:underline">Download</button>
                </td>
              </tr>
              <tr className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Tax Compliance Q3</td>
                <td className="py-3 px-4">Global Fleet</td>
                <td className="py-3 px-4">{formatDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000))}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">In Progress</span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-sm text-petroleum-seagreen hover:underline">View</button>
                </td>
              </tr>
              <tr className="hover:bg-gray-50">
                <td className="py-3 px-4 font-medium">Inventory Variance Audit</td>
                <td className="py-3 px-4">North Hub</td>
                <td className="py-3 px-4">{formatDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000))}</td>
                <td className="py-3 px-4">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">Completed</span>
                </td>
                <td className="py-3 px-4">
                  <button className="text-sm text-petroleum-seagreen hover:underline">Download</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsAnalytics;