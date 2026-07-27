import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStation } from '../../contexts/StationContext';
import { inventoryApi } from '../../api/inventory';
import {
  RefreshCw, Search, Filter, Download,
  TrendingUp, TrendingDown, Package,
  Truck, ArrowUpCircle, ArrowDownCircle,
  Calendar, FileText
} from 'lucide-react';
import { formatNumber, formatDate, formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import toast from 'react-hot-toast';

const ProductMovement: React.FC = () => {
  const { user } = useAuth();
  const { selectedStationId, isSuperAdmin, isRegionalManager, isSupervisor, stations } = useStation();
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedStationIdForFilter, setSelectedStationIdForFilter] = useState<string>('');

  // Determine if user can select stations
  const canSelectStation = isSuperAdmin || isRegionalManager || isSupervisor;

  // Set initial station ID
  useEffect(() => {
    if (isSuperAdmin && stations.length > 0) {
      setSelectedStationIdForFilter(stations[0].id);
    } else if (selectedStationId) {
      setSelectedStationIdForFilter(selectedStationId);
    }
  }, [isSuperAdmin, stations, selectedStationId]);

  // Fetch movements when station or filters change
  useEffect(() => {
    if (selectedStationIdForFilter) {
      fetchMovements();
    }
  }, [selectedStationIdForFilter, productFilter, dateRange]);

  const fetchMovements = async () => {
    try {
      setLoading(true);
      
      // Use the selected station ID from the filter
      const stationId = selectedStationIdForFilter;
      
      if (!stationId) {
        toast.error('No station selected');
        setLoading(false);
        return;
      }
      
      const data = await inventoryApi.getProductMovement(stationId, {
        productType: productFilter || undefined,
        days: dateRange.start ? undefined : 30,
      });
      setMovements(data.movements || []);
      setSummary(data.summary);
      setTotalPages(Math.ceil((data.movements?.length || 0) / 10));
    } catch (error) {
      console.error('Error fetching product movements:', error);
      toast.error('Failed to load product movement data');
    } finally {
      setLoading(false);
    }
  };

  const handleStationChange = (stationId: string) => {
    setSelectedStationIdForFilter(stationId);
  };

  const filteredMovements = movements.filter(m =>
    m.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedMovements = filteredMovements.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Product Movement</h1>
          <p className="text-gray-500">Track inventory movement and stock changes</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchMovements}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Station Selector for Super Admin, Regional Manager, Supervisor */}
      {canSelectStation && stations.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Station
          </label>
          <select
            value={selectedStationIdForFilter}
            onChange={(e) => handleStationChange(e.target.value)}
            className="w-full md:w-64 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          >
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name} ({station.code})
              </option>
            ))}
          </select>
          {isRegionalManager && (
            <p className="text-xs text-gray-500 mt-2">
              Showing stations in your region
            </p>
          )}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Package className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Inflow</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatNumber(summary?.totalInflow || 0)} L
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <Truck className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Outflow</p>
              <p className="text-2xl font-bold text-red-600">
                {formatNumber(summary?.totalOutflow || 0)} L
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
              <p className="text-sm text-gray-500">Net Change</p>
              <p className={`text-2xl font-bold ${(summary?.netChange || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatNumber(summary?.netChange || 0)} L
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Calendar className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Transactions</p>
              <p className="text-2xl font-bold text-purple-600">
                {movements.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by product type or reason..."
          />
        </div>
        <div className="flex gap-3 flex-wrap">
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          >
            <option value="">All Products</option>
            <option value="PMS">PMS (Premium)</option>
            <option value="AGO">AGO (Diesel)</option>
            <option value="DPK">DPK (Kerosene)</option>
            <option value="LPG">LPG (Gas)</option>
          </select>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          />
        </div>
      </div>

      {/* Movement Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Date & Time</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Product</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Type</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Volume</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Reason</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">User</th>
              </tr>
            </thead>
            <tbody>
              {paginatedMovements.map((movement) => (
                <tr key={movement.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{formatDateTime(movement.createdAt)}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium">{movement.productType}</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                      movement.adjustment > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {movement.adjustment > 0 ? (
                        <ArrowUpCircle size={14} />
                      ) : (
                        <ArrowDownCircle size={14} />
                      )}
                      {movement.adjustment > 0 ? 'Inflow' : 'Outflow'}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-medium ${
                    movement.adjustment > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {formatNumber(Math.abs(movement.adjustment))} L
                  </td>
                  <td className="py-3 px-4 text-sm">{movement.reason}</td>
                  <td className="py-3 px-4 text-sm">{movement.user?.firstName || 'System'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}
    </div>
  );
};

export default ProductMovement;