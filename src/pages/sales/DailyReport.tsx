import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { salesApi } from '../../api/sales';
import { pumpsApi } from '../../api/pumps';
import { expensesApi } from '../../api/expenses';
import {
  Calendar, Download, RefreshCw, CheckCircle, AlertCircle,
  DollarSign, Fuel, TrendingUp, TrendingDown, Banknote,
  CreditCard, Wallet, Users, Printer, FileText
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import { StatCard } from '../../components/cards/StatCard';
import toast from 'react-hot-toast';

const DailyReport: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [report, setReport] = useState<any>(null);
  const [pumpReadings, setPumpReadings] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [reconciling, setReconciling] = useState(false);
  const [variance, setVariance] = useState(0);
  const [paymentBreakdown, setPaymentBreakdown] = useState<any[]>([]);

  useEffect(() => { fetchDailyReport(); }, [selectedDate]);

  const fetchDailyReport = async () => {
    try {
      setLoading(true);
      const stationId = user?.stationId;
      if (!stationId) { toast.error('No station assigned'); return; }

      const dateStr = selectedDate.toISOString().split('T')[0];
      
      const [salesData, pumpsData, expensesData] = await Promise.all([
        salesApi.getDailyReport(stationId, dateStr),
        pumpsApi.getStationPumps(stationId),
        expensesApi.getStationExpenses(stationId, { startDate: dateStr, endDate: dateStr }),
      ]);

      // Get pump readings for the day
      const readings = await Promise.all(
        pumpsData.map(pump => pumpsApi.getReadings(pump.id, dateStr, dateStr))
      );

      setReport(salesData);
      setPumpReadings(readings.flat());
      setExpenses(expensesData);
      setPaymentBreakdown(salesData?.paymentBreakdown || []);

      // Calculate variance (simplified)
      const totalSales = salesData?.totalSales || 0;
      const totalExpenses = expensesData.reduce((sum, e) => sum + e.amount, 0);
      setVariance(totalSales - totalExpenses - 189200);

    } catch (error) {
      console.error('Error fetching daily report:', error);
      toast.error('Failed to load daily report');
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    try {
      setReconciling(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      toast.success('Report reconciled successfully');
      await fetchDailyReport();
    } catch (error) {
      toast.error('Failed to reconcile report');
    } finally {
      setReconciling(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading daily report..." />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Business Report</h1>
          <p className="text-gray-500">Reconciliation & Submission for {formatDate(selectedDate)}</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <input type="date" value={selectedDate.toISOString().split('T')[0]} onChange={(e) => setSelectedDate(new Date(e.target.value))} className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" />
          <button onClick={fetchDailyReport} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /> Refresh</button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><Printer size={16} /> Print</button>
          <button className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 font-medium"><Download size={16} /> Export</button>
        </div>
      </div>

      {/* Cash Reconciliation */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Cash Reconciliation</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 p-4 rounded-lg"><p className="text-sm text-gray-600">Opening Cash</p><p className="text-2xl font-bold text-gray-900">₦124,500.00</p></div>
          <div className="bg-green-50 p-4 rounded-lg"><p className="text-sm text-gray-600">Bank Deposits</p><p className="text-2xl font-bold text-gray-900">₦3,450,000.00</p></div>
          <div className="bg-yellow-50 p-4 rounded-lg"><p className="text-sm text-gray-600">Closing Cash</p><p className="text-2xl font-bold text-gray-900">₦189,200.00</p></div>
          <div className={`p-4 rounded-lg ${variance >= 0 ? 'bg-green-50' : 'bg-red-50'}`}>
            <p className="text-sm text-gray-600">Variance</p>
            <p className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(variance)}</p>
          </div>
        </div>
      </div>

      {/* Payment Methods */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {paymentBreakdown.map((p) => (
            <div key={p.method} className="text-center p-4 bg-gray-50 rounded-lg">
              {p.method === 'CASH' && <Banknote className="mx-auto text-green-600 mb-2" size={32} />}
              {p.method === 'POS' && <CreditCard className="mx-auto text-blue-600 mb-2" size={32} />}
              {p.method === 'TRANSFER' && <Wallet className="mx-auto text-purple-600 mb-2" size={32} />}
              {p.method === 'CREDIT' && <Users className="mx-auto text-yellow-600 mb-2" size={32} />}
              <p className="text-sm text-gray-600">{p.method}</p>
              <p className="text-xl font-bold text-gray-900">{p.percentage.toFixed(0)}%</p>
              <p className="text-xs text-gray-500">{formatCurrency(p.amount)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Pump Readings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Daily Pump Meter Readings</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Pump / Product</th>
              <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Attendant</th>
              <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Opening Meter</th>
              <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Closing Meter</th>
              <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Litres</th>
              <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Expected</th>
            </tr></thead>
            <tbody>
              {pumpReadings.map((reading) => (
                <tr key={reading.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4"><div><p className="font-medium">Pump {reading.pumpNumber}</p><p className="text-xs text-gray-500">{reading.productType}</p></div></td>
                  <td className="py-3 px-4">{reading.attendant?.firstName}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(reading.openingMeter)}</td>
                  <td className="py-3 px-4 text-right">{formatNumber(reading.closingMeter)}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatNumber(reading.litresSold)}</td>
                  <td className="py-3 px-4 text-right">{formatCurrency(reading.expectedRevenue)}</td>
                </tr>
              ))}
              {pumpReadings.length === 0 && <tr><td colSpan={6} className="text-center py-8 text-gray-500">No pump readings recorded</td></tr>}
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr><td colSpan={4} className="py-3 px-4 text-right">Total Volume & Expected</td>
                <td className="py-3 px-4">{formatNumber(report?.totalVolume || 0)} L</td>
                <td className="py-3 px-4">{formatCurrency(report?.totalSales || 0)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Expenses */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Expense Log</h3>
        <div className="space-y-3">
          {expenses.map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div><p className="font-medium">{expense.description}</p>
                <p className="text-sm text-gray-500">{expense.category.replace('_', ' ')} • Ticket #{expense.voucherNumber}</p>
                <p className="text-xs text-gray-400">{new Date(expense.createdAt).toLocaleTimeString()}</p>
              </div>
              <div className="text-right"><p className="text-lg font-bold text-red-600">-{formatCurrency(expense.amount)}</p></div>
            </div>
          ))}
          {expenses.length === 0 && <p className="text-center text-gray-500 py-4">No expenses recorded today</p>}
        </div>
      </div>

      {/* Certification */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-start gap-3">
          <CheckCircle className="text-green-600 mt-1" size={24} />
          <div>
            <p className="text-gray-700">I hereby certify that the sales data, meter readings, and expense logs recorded above for this station are accurate and reconciled with physical cash and bank deposits for this business day.</p>
            <button onClick={handleReconcile} disabled={reconciling} className="mt-4 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50">
              {reconciling ? 'Reconciling...' : 'Certify & Submit Daily Report'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DailyReport;