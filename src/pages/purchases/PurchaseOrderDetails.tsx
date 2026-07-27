import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { purchasesApi } from '../../api/purchases';
import { ArrowLeft, Edit, Printer, Download, Truck, CheckCircle, XCircle, Clock } from 'lucide-react';
import { formatCurrency, formatNumber, formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const PurchaseOrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<any>(null);

  useEffect(() => { if (id) fetchOrder(); }, [id]);

  const fetchOrder = async () => {
    try { setLoading(true); const data = await purchasesApi.getById(id!); setOrder(data); }
    catch (error) { toast.error('Failed to load order'); }
    finally { setLoading(false); }
  };

  const handleStatusUpdate = async (status: string) => {
    try { await purchasesApi.updateStatus(id!, status); toast.success(`Order ${status.toLowerCase()}`); fetchOrder(); }
    catch (error) { toast.error('Failed to update status'); }
  };

  if (loading) return <Loader fullScreen text="Loading order details..." />;
  if (!order) return <div>Order not found</div>;

  const getStatusColor = (status: string) => ({
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING_APPROVAL: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    IN_TRANSIT: 'bg-purple-100 text-purple-700',
    DELIVERED: 'bg-green-100 text-green-700',
    CANCELLED: 'bg-red-100 text-red-700',
  }[status] || 'bg-gray-100 text-gray-700');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/purchases')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">Purchase Order #{order.orderNumber}</h1>
          <p className="text-gray-500">{order.supplierName}</p></div>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><Printer size={16} /> Print</button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><Download size={16} /> Download</button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Order Details</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Order Number</p><p className="font-medium">{order.orderNumber}</p></div>
              <div><p className="text-sm text-gray-500">Status</p><span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>{order.status.replace('_', ' ')}</span></div>
              <div><p className="text-sm text-gray-500">Supplier</p><p className="font-medium">{order.supplierName}</p>{order.supplierEmail && <p className="text-sm text-gray-500">{order.supplierEmail}</p>}</div>
              <div><p className="text-sm text-gray-500">Product</p><p className="font-medium">{order.productType}</p></div>
              <div><p className="text-sm text-gray-500">Volume</p><p className="font-medium">{formatNumber(order.volume)} L</p></div>
              <div><p className="text-sm text-gray-500">Unit Cost</p><p className="font-medium">{formatCurrency(order.unitCost)}</p></div>
              <div><p className="text-sm text-gray-500">Total Cost</p><p className="text-xl font-bold text-petroleum-seagreen">{formatCurrency(order.totalCost)}</p></div>
              <div><p className="text-sm text-gray-500">Payment Status</p><span className={`px-2 py-1 rounded-full text-xs font-medium ${order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : order.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'}`}>{order.paymentStatus}</span></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Delivery Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-sm text-gray-500">Expected Delivery</p><p className="font-medium">{order.expectedDelivery ? formatDateTime(order.expectedDelivery) : 'N/A'}</p></div>
              <div><p className="text-sm text-gray-500">Actual Delivery</p><p className="font-medium">{order.actualDelivery ? formatDateTime(order.actualDelivery) : 'Not delivered'}</p></div>
              {order.notes && <div className="col-span-2"><p className="text-sm text-gray-500">Notes</p><p className="text-sm text-gray-600">{order.notes}</p></div>}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Actions</h3>
            <div className="space-y-2">
              {order.status === 'PENDING_APPROVAL' && <button onClick={() => handleStatusUpdate('APPROVED')} className="flex items-center gap-2 w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><CheckCircle size={16} /> Approve Order</button>}
              {order.status === 'APPROVED' && <button onClick={() => handleStatusUpdate('IN_TRANSIT')} className="flex items-center gap-2 w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"><Truck size={16} /> Mark In Transit</button>}
              {order.status === 'IN_TRANSIT' && <button onClick={() => handleStatusUpdate('DELIVERED')} className="flex items-center gap-2 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"><CheckCircle size={16} /> Mark Delivered</button>}
              {(order.status === 'DRAFT' || order.status === 'PENDING_APPROVAL') && <button onClick={() => handleStatusUpdate('CANCELLED')} className="flex items-center gap-2 w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"><XCircle size={16} /> Cancel Order</button>}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3"><div className="w-2 h-2 mt-2 rounded-full bg-green-500" /><div><p className="text-sm font-medium">Created</p><p className="text-xs text-gray-500">{formatDateTime(order.createdAt)}</p></div></div>
              {order.approvedAt && <div className="flex items-start gap-3"><div className="w-2 h-2 mt-2 rounded-full bg-blue-500" /><div><p className="text-sm font-medium">Approved</p><p className="text-xs text-gray-500">{formatDateTime(order.approvedAt)}</p></div></div>}
              {order.actualDelivery && <div className="flex items-start gap-3"><div className="w-2 h-2 mt-2 rounded-full bg-green-500" /><div><p className="text-sm font-medium">Delivered</p><p className="text-xs text-gray-500">{formatDateTime(order.actualDelivery)}</p></div></div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetails;