import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { salesApi } from '../../api/sales';
import { pumpsApi } from '../../api/pumps';
import { expensesApi } from '../../api/expenses';
import {
  RefreshCw, CheckCircle, AlertCircle, DollarSign,
  Banknote, CreditCard, Wallet, Users, FileText,
  Printer, Download, Calculator, TrendingUp, TrendingDown
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import { StatCard } from '../../components/cards/StatCard';
import toast from 'react-hot-toast';

const Reconciliation: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [report, setReport] = useState<any>(null);
  const [pumpReadings, setPumpReadings] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [reconciling, setReconciling] = useState(false);
  const [variance, setVariance] = useState(0);

  useEffect(() => {
    fetchReconciliationData();
  }, [selectedDate]);

  const fetchReconciliationData = async () => {
    try {
      setLoading(true);
      const stationId = user?.stationId;
      if (!stationId) {
        toast.error('No station assigned');
        return;
      }

      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const [salesData, pumpsData, expensesData] = await Promise.all([
        salesApi.getDailyReport(stationId, dateStr),
        pumpsApi.getStationPumps(stationId),
        expensesApi.getStationExpenses(stationId, { startDate: dateStr, endDate: dateStr }),
      ]);

      // Get pump readings for the day
      const readings = await Promise.all(
        pumpsData.map(pump => 
          pumpsApi.getReadings(pump.id, dateStr, dateStr)
        )
      );

      setReport(salesData);
      setPumpReadings(readings.flat());
      setExpenses(expensesData);

      // Calculate variance
      const totalSales = salesData?.totalSales || 0;
      const totalExpenses = expensesData.reduce((sum, e) => sum + e.amount, 0);
      const expectedCash = totalSales - totalExpenses;
      const actualCash = 189200; // This would come from actual cash count
      setVariance(actualCash - expectedCash);

    } catch (error) {
      console.error('Error fetching reconciliation data:', error);
      toast.error('Failed to load reconciliation data');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    try {
      setReconciling(true);
      // In production, this would call an API to save the reconciliation
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Reconciliation completed successfully');
      await fetchReconciliationData();
    } catch (error) {
      toast.error('Failed to complete reconciliation');
    } finally {
      setReconciling(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading reconciliation data..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Cash Reconciliation</h1>
          <p className="text-gray-500">Reconcile daily sales, expenses, and cash positions</p>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate.toISOString().split('T')[0]}
            onChange={(e) => setSelectedDate(new Date(e.target.value))}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          />
          <button
            onClick={fetchReconciliationData}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button
            onClick={handleReconcile}
            disabled={reconciling}
            className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50"
          >
            <CheckCircle size={18} />
            {reconciling ? 'Reconciling...' : 'Reconcile'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Sales"
          value={formatCurrency(report?.totalSales || 0)}
          icon={DollarSign}
          subtitle={`${report?.transactionCount || 0} transactions`}
          color="blue"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}
          icon={TrendingDown}
          subtitle={`${expenses.length} expense entries`}
          color="red"
        />
        <StatCard
          title="Net Revenue"
          value={formatCurrency((report?.totalSales || 0) - expenses.reduce((sum, e) => sum + e.amount, 0))}
          icon={Calculator}
          color="green"
        />
        <StatCard
          title="Variance"
          value={formatCurrency(variance)}
          icon={variance >= 0 ? TrendingUp : TrendingDown}
          color={variance >= 0 ? 'green' : 'red'}
        />
      </div>

      {/* Sales Breakdown */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Breakdown</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 bg-green-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Banknote className="text-green-600" size={20} />
              <p className="text-sm text-gray-600">Cash</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency((report?.paymentBreakdown?.find(p => p.method === 'CASH')?.amount) || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {(report?.paymentBreakdown?.find(p => p.method === 'CASH')?.percentage || 0).toFixed(1)}%
            </p>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center gap-2">
              <CreditCard className="text-blue-600" size={20} />
              <p className="text-sm text-gray-600">POS</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency((report?.paymentBreakdown?.find(p => p.method === 'POS')?.amount) || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {(report?.paymentBreakdown?.find(p => p.method === 'POS')?.percentage || 0).toFixed(1)}%
            </p>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Wallet className="text-purple-600" size={20} />
              <p className="text-sm text-gray-600">Transfer</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency((report?.paymentBreakdown?.find(p => p.method === 'TRANSFER')?.amount) || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {(report?.paymentBreakdown?.find(p => p.method === 'TRANSFER')?.percentage || 0).toFixed(1)}%
            </p>
          </div>
          <div className="p-4 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-2">
              <Users className="text-yellow-600" size={20} />
              <p className="text-sm text-gray-600">Credit</p>
            </div>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency((report?.paymentBreakdown?.find(p => p.method === 'CREDIT')?.amount) || 0)}
            </p>
            <p className="text-sm text-gray-500">
              {(report?.paymentBreakdown?.find(p => p.method === 'CREDIT')?.percentage || 0).toFixed(1)}%
            </p>
          </div>
        </div>
      </div>

      {/* Reconciliation Table */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Reconciliation Details</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Item</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Expected</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Actual</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Variance</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Opening Cash</td>
                <td className="py-3 px-4 text-right">₦124,500.00</td>
                <td className="py-3 px-4 text-right">₦124,500.00</td>
                <td className="py-3 px-4 text-right text-green-600">₦0.00</td>
                <td className="py-3 px-4 text-right">
                  <CheckCircle className="inline text-green-600" size={18} />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Total Sales</td>
                <td className="py-3 px-4 text-right">{formatCurrency(report?.totalSales || 0)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(report?.totalSales || 0)}</td>
                <td className="py-3 px-4 text-right text-green-600">₦0.00</td>
                <td className="py-3 px-4 text-right">
                  <CheckCircle className="inline text-green-600" size={18} />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Total Expenses</td>
                <td className="py-3 px-4 text-right">{formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(expenses.reduce((sum, e) => sum + e.amount, 0))}</td>
                <td className="py-3 px-4 text-right text-green-600">₦0.00</td>
                <td className="py-3 px-4 text-right">
                  <CheckCircle className="inline text-green-600" size={18} />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Bank Deposits</td>
                <td className="py-3 px-4 text-right">₦3,450,000.00</td>
                <td className="py-3 px-4 text-right">₦3,450,000.00</td>
                <td className="py-3 px-4 text-right text-green-600">₦0.00</td>
                <td className="py-3 px-4 text-right">
                  <CheckCircle className="inline text-green-600" size={18} />
                </td>
              </tr>
              <tr className="border-b border-gray-100">
                <td className="py-3 px-4 font-medium">Closing Cash</td>
                <td className="py-3 px-4 text-right">{formatCurrency((report?.totalSales || 0) - expenses.reduce((sum, e) => sum + e.amount, 0))}</td>
                <td className="py-3 px-4 text-right">₦189,200.00</td>
                <td className={`py-3 px-4 text-right ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(variance)}
                </td>
                <td className="py-3 px-4 text-right">
                  {variance === 0 ? (
                    <CheckCircle className="inline text-green-600" size={18} />
                  ) : (
                    <AlertCircle className="inline text-yellow-600" size={18} />
                  )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-3">
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Printer size={16} />
          Print Report
        </button>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Download size={16} />
          Export PDF
        </button>
      </div>
    </div>
  );
};

export default Reconciliation;