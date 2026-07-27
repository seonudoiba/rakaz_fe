import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { purchasesApi } from '../../api/purchases';
import {
  Plus, Search, Filter, Download, RefreshCw,
  Eye, Edit, CheckCircle, XCircle, Clock,
  Truck, Package, AlertCircle
} from 'lucide-react';
import { PurchaseOrder, PurchaseOrderStatus } from '../../types';
import { formatCurrency, formatNumber, formatDate, formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const PurchaseOrders: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PurchaseOrder | null>(null);

  useEffect(() => {
    fetchOrders();
  }, [currentPage, statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await purchasesApi.getAll({
        status: statusFilter as PurchaseOrderStatus || undefined,
        stationId: user?.stationId,
      });
      setOrders(data);
      setTotalPages(Math.ceil(data.length / 10));
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      toast.error('Failed to load purchase orders');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await purchasesApi.updateStatus(id, status);
      toast.success(`Purchase order ${status.toLowerCase()}`);
      fetchOrders();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const filteredOrders = orders.filter(order =>
    order.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.productType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  const getStatusColor = (status: string) => {
    const colors = {
      DRAFT: 'bg-gray-100 text-gray-700',
      PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
      APPROVED: 'bg-blue-100 text-blue-700',
      IN_TRANSIT: 'bg-purple-100 text-purple-700',
      DELIVERED: 'bg-green-100 text-green-700',
      CANCELLED: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DELIVERED': return <CheckCircle className="text-green-600" size={16} />;
      case 'CANCELLED': return <XCircle className="text-red-600" size={16} />;
      case 'IN_TRANSIT': return <Truck className="text-purple-600" size={16} />;
      case 'PENDING_APPROVAL': return <Clock className="text-yellow-600" size={16} />;
      default: return <Package className="text-gray-600" size={16} />;
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
          <p className="text-gray-500">Manage supplier orders and inventory procurement</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/purchases/create')}
            className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
          >
            <Plus size={18} />
            New Purchase Order
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{orders.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Pending</p>
          <p className="text-2xl font-bold text-yellow-600">
            {orders.filter(o => o.status === 'PENDING_APPROVAL').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">In Transit</p>
          <p className="text-2xl font-bold text-purple-600">
            {orders.filter(o => o.status === 'IN_TRANSIT').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Delivered</p>
          <p className="text-2xl font-bold text-green-600">
            {orders.filter(o => o.status === 'DELIVERED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-petroleum-seagreen">
            {formatCurrency(orders.reduce((sum, o) => sum + o.totalCost, 0))}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by supplier, order number, or product..."
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          >
            <option value="">All Status</option>
            <option value="DRAFT">Draft</option>
            <option value="PENDING_APPROVAL">Pending Approval</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Order #</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Supplier</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Product</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Volume</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Total Cost</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Expected</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Status</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-medium text-petroleum-seagreen">{order.orderNumber}</span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium">{order.supplierName}</p>
                      <p className="text-xs text-gray-500">{order.supplierEmail || 'No email'}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">{order.productType}</td>
                  <td className="py-3 px-4">{formatNumber(order.volume)} L</td>
                  <td className="py-3 px-4 font-medium">{formatCurrency(order.totalCost)}</td>
                  <td className="py-3 px-4">
                    {order.expectedDelivery ? formatDate(order.expectedDelivery) : 'N/A'}
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusIcon(order.status)}
                      {order.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedOrder(order);
                          setShowDetailsModal(true);
                        }}
                        className="p-1 text-gray-500 hover:text-petroleum-seagreen transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {order.status === 'PENDING_APPROVAL' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'APPROVED')}
                          className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                          title="Approve"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {order.status === 'APPROVED' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'IN_TRANSIT')}
                          className="p-1 text-purple-500 hover:text-purple-700 transition-colors"
                          title="Mark In Transit"
                        >
                          <Truck size={18} />
                        </button>
                      )}
                      {order.status === 'IN_TRANSIT' && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'DELIVERED')}
                          className="p-1 text-green-500 hover:text-green-700 transition-colors"
                          title="Mark Delivered"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      {(order.status === 'DRAFT' || order.status === 'PENDING_APPROVAL') && (
                        <button
                          onClick={() => handleStatusUpdate(order.id, 'CANCELLED')}
                          className="p-1 text-red-500 hover:text-red-700 transition-colors"
                          title="Cancel"
                        >
                          <XCircle size={18} />
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
        title="Purchase Order Details"
        size="lg"
      >
        {selectedOrder && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Order Number</p>
                <p className="font-medium">{selectedOrder.orderNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                  {getStatusIcon(selectedOrder.status)}
                  {selectedOrder.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="font-medium">{selectedOrder.supplierName}</p>
                {selectedOrder.supplierEmail && (
                  <p className="text-sm text-gray-500">{selectedOrder.supplierEmail}</p>
                )}
                {selectedOrder.supplierPhone && (
                  <p className="text-sm text-gray-500">{selectedOrder.supplierPhone}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Product Details</p>
                <p className="font-medium">{selectedOrder.productType}</p>
                <p className="text-sm text-gray-500">{formatNumber(selectedOrder.volume)} L</p>
                <p className="text-sm text-gray-500">Unit Cost: {formatCurrency(selectedOrder.unitCost)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Total Cost</p>
                <p className="text-2xl font-bold text-petroleum-seagreen">{formatCurrency(selectedOrder.totalCost)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Payment Status</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedOrder.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' :
                  selectedOrder.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {selectedOrder.paymentStatus}
                </span>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Expected Delivery</p>
              <p className="font-medium">{selectedOrder.expectedDelivery ? formatDate(selectedOrder.expectedDelivery) : 'N/A'}</p>
            </div>

            {selectedOrder.notes && (
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-sm text-gray-600">{selectedOrder.notes}</p>
              </div>
            )}

            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Created</p>
              <p className="text-sm text-gray-600">
                {formatDateTime(selectedOrder.createdAt)} by {selectedOrder.createdBy?.firstName} {selectedOrder.createdBy?.lastName}
              </p>
              {selectedOrder.approvedBy && (
                <p className="text-sm text-gray-600">
                  Approved by {selectedOrder.approvedBy.firstName} {selectedOrder.approvedBy.lastName} at {formatDateTime(selectedOrder.approvedAt!)}
                </p>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default PurchaseOrders;