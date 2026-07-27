import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStation } from '../../contexts/StationContext';
import { inventoryApi } from '../../api/inventory';
import { useSocket } from '../../contexts/SocketContext';
import {
  RefreshCw, AlertTriangle, CheckCircle, AlertCircle,
  Fuel, TrendingUp, TrendingDown, Clock, Tag, Edit3, Lock, Save
} from 'lucide-react';
import { Tank, TankStatus } from '../../types';
import { formatNumber, formatDateTime, formatCurrency } from '../../utils/formatters';
import { TankCard } from '../../components/cards/TankCard';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

interface ProductPriceItem {
  id?: string;
  productType: string;
  productName: string;
  unitPrice: number;
}

const TankMonitoring: React.FC = () => {
  const { user } = useAuth();
  const { selectedStationId, isSuperAdmin, isRegionalManager, isSupervisor, stations } = useStation();
  const { socket, isConnected } = useSocket();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [selectedStationIdForFilter, setSelectedStationIdForFilter] = useState<string>('');

  const canManagePrices = isSuperAdmin || isRegionalManager;
  const canSelectStation = isSuperAdmin || isRegionalManager || isSupervisor;

  const [productPrices, setProductPrices] = useState<ProductPriceItem[]>([]);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [editingPrice, setEditingPrice] = useState<ProductPriceItem | null>(null);
  const [priceForm, setPriceForm] = useState({ unitPrice: 0, productName: '' });

  // Set initial station ID
  useEffect(() => {
    if (isSuperAdmin && stations.length > 0) {
      setSelectedStationIdForFilter(stations[0].id);
    } else if (selectedStationId) {
      setSelectedStationIdForFilter(selectedStationId);
    }
  }, [isSuperAdmin, stations, selectedStationId]);

  // Fetch data when station changes
  useEffect(() => {
    if (selectedStationIdForFilter) {
      fetchTanks();
      fetchPrices();
    }
  }, [selectedStationIdForFilter]);

  const fetchPrices = async () => {
    try {
      const stationId = selectedStationIdForFilter || undefined;
      const prices = await inventoryApi.getProductPrices(stationId);
      if (prices) {
        setProductPrices(prices);
      }
    } catch (err) {
      console.error('Error fetching product prices:', err);
    }
  };

  useEffect(() => {
    if (socket) {
      socket.on('tank:update', (data) => {
        setTanks(prev => prev.map(tank => 
          tank.id === data.tankId ? { ...tank, ...data } : tank
        ));
        setLastUpdated(new Date());
      });
    }

    return () => {
      if (socket) {
        socket.off('tank:update');
      }
    };
  }, [socket]);

  const fetchTanks = async () => {
    try {
      setLoading(true);
      const stationId = selectedStationIdForFilter;
      if (!stationId) {
        toast.error('No station selected');
        setLoading(false);
        return;
      }
      const data = await inventoryApi.getTankMonitoring(stationId);
      setTanks(data.tanks || []);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching tanks:', error);
      toast.error('Failed to load tank data');
    } finally {
      setLoading(false);
    }
  };

  const handleStationChange = (stationId: string) => {
    setSelectedStationIdForFilter(stationId);
  };

  const getStatusStats = () => {
    const normal = tanks.filter(t => t.status === TankStatus.NORMAL).length;
    const warning = tanks.filter(t => t.status === TankStatus.WARNING).length;
    const critical = tanks.filter(t => t.status === TankStatus.CRITICAL).length;
    return { normal, warning, critical };
  };

  const stats = getStatusStats();

  const handleSavePrice = async () => {
    if (!editingPrice) return;
    try {
      await inventoryApi.updateProductPrice({
        stationId: selectedStationIdForFilter || undefined,
        productType: editingPrice.productType,
        productName: priceForm.productName || editingPrice.productName,
        unitPrice: priceForm.unitPrice,
      });
      toast.success(`Price updated for ${editingPrice.productType}`);
      setShowPriceModal(false);
      fetchPrices();
    } catch (err: any) {
      console.error('Error updating product price:', err);
      toast.error(err.response?.data?.message || 'Failed to update price');
    }
  };

  const openPriceEdit = (p: ProductPriceItem) => {
    if (!canManagePrices) {
      toast.error('Only Regional Managers and Super Admins can update product prices.');
      return;
    }
    setEditingPrice(p);
    setPriceForm({ unitPrice: p.unitPrice, productName: p.productName });
    setShowPriceModal(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tank & Product Inventory</h1>
          <p className="text-gray-500">Live telemetry & official product pricing catalog</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock size={16} />
            <span>Last updated: {formatDateTime(lastUpdated)}</span>
            {isConnected ? (
              <span className="flex items-center gap-1 text-green-600">
                <CheckCircle size={14} />
                Live
              </span>
            ) : (
              <span className="flex items-center gap-1 text-yellow-600">
                <AlertCircle size={14} />
                Offline
              </span>
            )}
          </div>
          <button
            onClick={() => { fetchTanks(); fetchPrices(); }}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
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

      {/* Product Pricing Catalog Section */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Tag className="text-petroleum-seagreen" size={20} />
            <h2 className="text-lg font-semibold text-gray-900">Official Product Prices</h2>
          </div>
          {!canManagePrices && (
            <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
              <Lock size={12} /> Managed by Regional Manager & Super Admin
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {productPrices.map((p) => (
            <div key={p.productType} className="p-4 rounded-lg border border-gray-100 bg-gray-50 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{p.productType}</span>
                <p className="font-medium text-gray-900 text-sm">{p.productName}</p>
                <p className="text-xl font-bold text-petroleum-dark mt-1">{formatCurrency(p.unitPrice)} / L</p>
              </div>
              {canManagePrices && (
                <button
                  onClick={() => openPriceEdit(p)}
                  className="p-2 text-gray-500 hover:text-petroleum-seagreen hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200"
                  title="Edit Product Price"
                >
                  <Edit3 size={16} />
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Fuel className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Tanks</p>
              <p className="text-2xl font-bold text-gray-900">{tanks.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Normal</p>
              <p className="text-2xl font-bold text-green-600">{stats.normal}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <AlertTriangle className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Warning</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.warning}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertCircle className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Critical</p>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tank Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tanks.map((tank) => (
          <TankCard key={tank.id} tank={tank} />
        ))}
      </div>

      {tanks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Fuel className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">No tanks found for this station</p>
        </div>
      )}

      {/* Edit Price Modal */}
      <Modal
        isOpen={showPriceModal}
        onClose={() => setShowPriceModal(false)}
        title={`Edit Price for ${editingPrice?.productType || ''}`}
        size="sm"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleSavePrice(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
            <input
              type="text"
              value={priceForm.productName}
              onChange={(e) => setPriceForm({ ...priceForm, productName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₦/Litre)</label>
            <input
              type="number"
              step="0.01"
              value={priceForm.unitPrice}
              onChange={(e) => setPriceForm({ ...priceForm, unitPrice: parseFloat(e.target.value) || 0 })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              required
            />
          </div>
          <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowPriceModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium text-sm"
            >
              <Save size={16} />
              Save Price
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default TankMonitoring;