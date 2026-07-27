import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { stationsApi } from '../../api/stations';
import { salesApi } from '../../api/sales';
import { pumpsApi } from '../../api/pumps';
import { inventoryApi } from '../../api/inventory';
import { expensesApi } from '../../api/expenses';
import {
  ArrowLeft, MapPin, Phone, Mail, Clock, Users, Fuel,
  Edit, Download, RefreshCw, Truck, Package, DollarSign,
  Calendar, AlertTriangle, CheckCircle, BarChart3
} from 'lucide-react';
import { TankCard } from '../../components/cards/TankCard';
import { StatCard } from '../../components/cards/StatCard';
import SalesChart from '../../components/charts/SalesChart';
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const StationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [station, setStation] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [salesData, setSalesData] = useState<any>(null);
  const [expensesData, setExpensesData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (id) fetchStationData();
  }, [id]);

  const fetchStationData = async () => {
    try {
      setLoading(true);
      const [stationData, salesReport, expensesReport] = await Promise.all([
        stationsApi.getOne(id!),
        salesApi.getDailyReport(id!),
        expensesApi.getStationExpenses(id!, { startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0] }),
      ]);

      setStation(stationData);
      setSalesData(salesReport);
      setExpensesData(expensesReport);
    } catch (error) {
      console.error('Error fetching station data:', error);
      toast.error('Failed to load station details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading station details..." />;
  if (!station) return <div className="text-center py-12 text-gray-500">Station not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/stations')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{station.name}</h1>
            <p className="text-gray-500">{station.code} • {station.city}, {station.state}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${station.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'}`}>
            {station.isActive ? 'Active' : 'Inactive'}
          </span>
          <button onClick={() => navigate(`/stations/management?id=${station.id}`)} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Edit size={16} /> Edit
          </button>
          <button onClick={fetchStationData} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <RefreshCw size={16} /> Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium">
            <Download size={16} /> Export
          </button>
        </div>
      </div>

      {/* Station Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg"><MapPin className="text-blue-600" size={20} /></div>
            <div><p className="text-sm text-gray-500">Address</p><p className="text-sm font-medium">{station.address}</p></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg"><Phone className="text-green-600" size={20} /></div>
            <div><p className="text-sm text-gray-500">Contact</p><p className="text-sm font-medium">{station.phone || 'N/A'}</p></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg"><Users className="text-yellow-600" size={20} /></div>
            <div><p className="text-sm text-gray-500">Manager</p><p className="text-sm font-medium">{station.manager?.firstName || 'Not assigned'}</p></div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg"><Clock className="text-purple-600" size={20} /></div>
            <div><p className="text-sm text-gray-500">Hours</p><p className="text-sm font-medium">{station.openingTime || 'N/A'} - {station.closingTime || 'N/A'}</p></div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Today's Sales" value={formatCurrency(salesData?.totalSales || 0)} icon={DollarSign} subtitle={`${salesData?.transactionCount || 0} transactions`} color="blue" />
        <StatCard title="Volume Sold" value={`${formatNumber(salesData?.totalVolume || 0)} L`} icon={Fuel} subtitle="Total fuel volume" color="green" />
        <StatCard title="Active Pumps" value={station.pumps?.filter((p: any) => p.isActive).length || 0} icon={Truck} subtitle={`${station.pumps?.length || 0} total pumps`} color="purple" />
        <StatCard title="Tanks" value={station.tanks?.length || 0} icon={Package} subtitle={`${station.tanks?.filter((t: any) => t.percentage < 30).length || 0} low stock`} color="yellow" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <div className="flex gap-6 min-w-max">
          {['overview', 'tanks', 'pumps', 'sales', 'expenses', 'reports'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 px-1 text-sm font-medium border-b-2 transition-colors ${activeTab === tab ? 'border-petroleum-seagreen text-petroleum-seagreen' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Tank Status</h3>
              <div className="space-y-3">
                {station.tanks?.map((tank: any) => <TankCard key={tank.id} tank={tank} />)}
                {station.tanks?.length === 0 && <p className="text-gray-500 text-center py-4">No tanks configured</p>}
              </div>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              <div className="space-y-3">
                {salesData?.transactions?.slice(0, 5).map((sale: any) => (
                  <div key={sale.id} className="flex items-center justify-between p-3 border-b border-gray-100">
                    <div><p className="text-sm font-medium">{sale.productName}</p><p className="text-xs text-gray-500">{formatDateTime(sale.createdAt)}</p></div>
                    <div className="text-right"><p className="text-sm font-bold">{formatCurrency(sale.totalAmount)}</p><p className="text-xs text-gray-500">{sale.quantity} L</p></div>
                  </div>
                ))}
                {salesData?.transactions?.length === 0 && <p className="text-gray-500 text-center py-4">No transactions today</p>}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'tanks' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">All Tanks</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {station.tanks?.map((tank: any) => <TankCard key={tank.id} tank={tank} />)}
              {station.tanks?.length === 0 && <p className="text-gray-500 text-center py-8 col-span-3">No tanks configured</p>}
            </div>
          </div>
        )}

        {activeTab === 'pumps' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Pump Status</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-200">
                  <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Pump #</th>
                  <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Product</th>
                  <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Opening Meter</th>
                  <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Closing Meter</th>
                  <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Status</th>
                </tr></thead>
                <tbody>
                  {station.pumps?.map((pump: any) => (
                    <tr key={pump.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 font-medium">{pump.pumpNumber}</td>
                      <td className="py-3 px-4">{pump.productType}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(pump.openingMeter)}</td>
                      <td className="py-3 px-4 text-right">{formatNumber(pump.closingMeter)}</td>
                      <td className="py-3 px-4"><span className={`px-2 py-1 rounded-full text-xs font-medium ${pump.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{pump.isActive ? 'Active' : 'Inactive'}</span></td>
                    </tr>
                  ))}
                  {station.pumps?.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-gray-500">No pumps configured</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Sales Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg text-center"><p className="text-sm text-gray-600">Total Sales</p><p className="text-2xl font-bold text-blue-600">{formatCurrency(salesData?.totalSales || 0)}</p></div>
              <div className="bg-green-50 p-4 rounded-lg text-center"><p className="text-sm text-gray-600">Total Volume</p><p className="text-2xl font-bold text-green-600">{formatNumber(salesData?.totalVolume || 0)} L</p></div>
              <div className="bg-purple-50 p-4 rounded-lg text-center"><p className="text-sm text-gray-600">Transactions</p><p className="text-2xl font-bold text-purple-600">{salesData?.transactionCount || 0}</p></div>
            </div>
            <SalesChart data={salesData?.transactions?.map((t: any) => ({ date: t.createdAt, sales: t.totalAmount, volume: t.quantity })) || []} />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Expenses Overview</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-red-50 p-4 rounded-lg text-center"><p className="text-sm text-gray-600">Total Expenses</p><p className="text-2xl font-bold text-red-600">{formatCurrency(expensesData?.reduce((sum: number, e: any) => sum + e.amount, 0) || 0)}</p></div>
              <div className="bg-yellow-50 p-4 rounded-lg text-center"><p className="text-sm text-gray-600">Pending Approvals</p><p className="text-2xl font-bold text-yellow-600">{expensesData?.filter((e: any) => !e.approvedById).length || 0}</p></div>
              <div className="bg-green-50 p-4 rounded-lg text-center"><p className="text-sm text-gray-600">Approved</p><p className="text-2xl font-bold text-green-600">{expensesData?.filter((e: any) => e.approvedById).length || 0}</p></div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-200">
                  <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Date</th>
                  <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Description</th>
                  <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Category</th>
                  <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Amount</th>
                </tr></thead>
                <tbody>
                  {expensesData?.slice(0, 10).map((expense: any) => (
                    <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{formatDate(expense.createdAt)}</td>
                      <td className="py-3 px-4 text-sm">{expense.description}</td>
                      <td className="py-3 px-4 text-sm">{expense.category.replace('_', ' ')}</td>
                      <td className="py-3 px-4 text-right font-bold">{formatCurrency(expense.amount)}</td>
                    </tr>
                  ))}
                  {expensesData?.length === 0 && <tr><td colSpan={4} className="text-center py-8 text-gray-500">No expenses recorded</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold mb-4">Station Reports</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <BarChart3 className="text-petroleum-seagreen mb-2" size={24} />
                <p className="font-medium">Sales Report</p>
                <p className="text-sm text-gray-500">Generate detailed sales report</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <BarChart3 className="text-blue-600 mb-2" size={24} />
                <p className="font-medium">Financial Report</p>
                <p className="text-sm text-gray-500">Generate financial summary</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <BarChart3 className="text-green-600 mb-2" size={24} />
                <p className="font-medium">Inventory Report</p>
                <p className="text-sm text-gray-500">Generate inventory status</p>
              </button>
              <button className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-left">
                <BarChart3 className="text-purple-600 mb-2" size={24} />
                <p className="font-medium">Custom Report</p>
                <p className="text-sm text-gray-500">Build custom report</p>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StationDetails;