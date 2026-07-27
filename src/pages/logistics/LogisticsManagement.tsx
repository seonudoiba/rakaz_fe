import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { logisticsApi } from '../../api/logistics';
import {
  Plus, Search, Filter, RefreshCw, Download,
  Truck, Package, Clock, CheckCircle, XCircle,
  MapPin, Eye, Edit, Trash2
} from 'lucide-react';
import { Delivery } from '../../types';
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const LogisticsManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(null);

  useEffect(() => {
    fetchDeliveries();
  }, [currentPage, statusFilter]);

  const fetchDeliveries = async () => {
    try {
      setLoading(true);
      const stationId = user?.stationId;
      const data = await logisticsApi.getAllDeliveries({
        status: statusFilter || undefined,
        stationId: stationId,
      });
      setDeliveries(data);
      setTotalPages(Math.ceil(data.length / 10));
    } catch (error) {
      console.error('Error fetching deliveries:', error);
      toast.error('Failed to load deliveries');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await logisticsApi.updateDeliveryStatus(id, status);
      toast.success(`Delivery ${status.toLowerCase()}`);
      fetchDeliveries();
    } catch (error) {
      toast.error('Failed to update delivery status');
    }
  };

  const filteredDeliveries = deliveries.filter(delivery =>
    delivery.tankerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.purchaseOrder?.supplierName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    delivery.driverName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedDeliveries = filteredDeliveries.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  const getStatusColor = (status: string) => {
    const colors = {
      IN_TRANSIT: 'bg-blue-100 text-blue-700',
      DELIVERED: 'bg-green-100 text-green-700',
      DELAYED: 'bg-yellow-100 text-yellow-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'IN_TRANSIT': return <Truck className="text-blue-600" size={16} />;
      case 'DELIVERED': return <CheckCircle className="text-green-600" size={16} />;
      case 'DELAYED': return <Clock className="text-yellow-600" size={16} />;
      case 'CANCELLED': return <XCircle className="text-red-600" size={16} />;
      default: return <Package className="text-gray-600" size={16} />;
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Logistics Management</h1>
          <p className="text-gray-500">Track deliveries and manage fleet operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/logistics/deliveries/create')}
            className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
          >
            <Plus size={18} />
            Create Delivery
          </button>
          <button
            onClick={fetchDeliveries}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{deliveries.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">In Transit</p>
          <p className="text-2xl font-bold text-blue-600">
            {deliveries.filter(d => d.status === 'IN_TRANSIT').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-2xl font-bold text-green-600">
            {deliveries.filter(d => d.status === 'DELIVERED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Delayed</p>
          <p className="text-2xl font-bold text-yellow-600">
            {deliveries.filter(d => d.status === 'DELAYED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Total Volume</p>
          <p className="text-2xl font-bold text-petroleum-seagreen">
            {formatNumber(deliveries.reduce((sum, d) => sum + d.volume, 0))} L
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by tanker ID, supplier, or driver..."
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          >
            <option value="">All Status</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="DELAYED">Delayed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Deliveries Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Tanker ID</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Supplier</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Driver</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Volume</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Dispatched</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Status</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedDeliveries.map((delivery) => (
                <tr key={delivery.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium">{delivery.tankerId}</span>
                  </td>
                  <td className="py-3 px-4">{delivery.purchaseOrder?.supplierName}</td>
                  <td className="py-3 px-4">{delivery.driverName || 'N/A'}</td>
                  <td className="py-3 px-4 text-right font-medium">{formatNumber(delivery.volume)} L</td>
                  <td className="py-3 px-4 text-sm">{formatDate(delivery.dispatchedAt)}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                      {getStatusIcon(delivery.status)}
                      {delivery.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDelivery(delivery);
                          setShowDetailsModal(true);
                        }}
                        className="p-1 text-gray-500 hover:text-petroleum-seagreen transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {delivery.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleUpdateStatus(delivery.id, 'DELIVERED')}
                          className="p-1 text-green-500 hover:text-green-700 transition-colors"
                          title="Mark Delivered"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {delivery.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => navigate(`/logistics/tracking/${delivery.id}`)}
                          className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                          title="Track"
                        >
                          <MapPin size={18} />
                        </button>
                      )}
                    </div>
                  </td>
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

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Delivery Details"
        size="lg"
      >
        {selectedDelivery && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tanker ID</p>
                <p className="font-medium">{selectedDelivery.tankerId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedDelivery.status)}`}>
                  {getStatusIcon(selectedDelivery.status)}
                  {selectedDelivery.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="font-medium">{selectedDelivery.purchaseOrder?.supplierName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Driver</p>
                <p className="font-medium">{selectedDelivery.driverName || 'N/A'}</p>
                {selectedDelivery.driverPhone && (
                  <p className="text-sm text-gray-500">{selectedDelivery.driverPhone}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Volume</p>
                <p className="text-2xl font-bold text-petroleum-seagreen">{formatNumber(selectedDelivery.volume)} L</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Product</p>
                <p className="font-medium">{selectedDelivery.purchaseOrder?.productType}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Dispatched</p>
                <p className="text-sm">{formatDateTime(selectedDelivery.dispatchedAt)}</p>
              </div>
              {selectedDelivery.deliveredAt && (
                <div>
                  <p className="text-sm text-gray-500">Delivered</p>
                  <p className="text-sm">{formatDateTime(selectedDelivery.deliveredAt)}</p>
                </div>
              )}
            </div>

            {selectedDelivery.currentLocation && (
              <div>
                <p className="text-sm text-gray-500">Current Location</p>
                <p className="text-sm font-mono">{selectedDelivery.currentLocation}</p>
              </div>
            )}

            {selectedDelivery.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm text-gray-600">{selectedDelivery.notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default LogisticsManagement;