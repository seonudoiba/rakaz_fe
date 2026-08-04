import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStation } from '../../contexts/StationContext';
import { inventoryApi } from '../../api/inventory';
import { 
  Plus, RefreshCw, Edit, Trash2, 
  Fuel, AlertTriangle, CheckCircle, 
  X, Save, TrendingUp, TrendingDown
} from 'lucide-react';
import { Tank, TankStatus } from '../../types';
import { formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const TankManagement: React.FC = () => {
  const navigate = useNavigate();
  const { selectedStationId, isSuperAdmin, isRegionalManager, stations } = useStation();
  const [tanks, setTanks] = useState<Tank[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStationIdForFilter, setSelectedStationIdForFilter] = useState<string>('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedTank, setSelectedTank] = useState<Tank | null>(null);

  const canManage = isSuperAdmin || isRegionalManager;
  const canSelectStation = isSuperAdmin || isRegionalManager;

  const [formData, setFormData] = useState({
    name: '',
    productType: 'PMS',
    capacity: '',
    currentLevel: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    productType: 'PMS',
    capacity: '',
    currentLevel: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isSuperAdmin && stations.length > 0) {
      setSelectedStationIdForFilter(stations[0].id);
    } else if (selectedStationId) {
      setSelectedStationIdForFilter(selectedStationId);
    }
  }, [isSuperAdmin, stations, selectedStationId]);

  useEffect(() => {
    if (selectedStationIdForFilter) {
      fetchTanks();
    }
  }, [selectedStationIdForFilter]);

  const fetchTanks = async () => {
    try {
      setLoading(true);
      const data = await inventoryApi.getTankMonitoring(selectedStationIdForFilter);
      setTanks(data.tanks || []);
    } catch (error) {
      console.error('Error fetching tanks:', error);
      toast.error('Failed to load tanks');
    } finally {
      setLoading(false);
    }
  };

  const handleStationChange = (stationId: string) => {
    setSelectedStationIdForFilter(stationId);
  };

  const getStatusBadge = (status: TankStatus) => {
    const colors = {
      [TankStatus.NORMAL]: 'bg-green-100 text-green-700',
      [TankStatus.WARNING]: 'bg-yellow-100 text-yellow-700',
      [TankStatus.CRITICAL]: 'bg-red-100 text-red-700',
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: TankStatus) => {
    switch (status) {
      case TankStatus.NORMAL: return <CheckCircle size={16} className="text-green-600" />;
      case TankStatus.WARNING: return <AlertTriangle size={16} className="text-yellow-600" />;
      case TankStatus.CRITICAL: return <AlertTriangle size={16} className="text-red-600" />;
      default: return null;
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Tank name is required';
    if (!formData.productType) newErrors.productType = 'Product type is required';
    if (!formData.capacity || parseFloat(formData.capacity) <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateTank = async () => {
    if (!validateForm()) return;
    try {
      await inventoryApi.createTank({
        ...formData,
        stationId: selectedStationIdForFilter,
        capacity: parseFloat(formData.capacity),
        currentLevel: parseFloat(formData.currentLevel) || 0,
      });
      toast.success('Tank created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchTanks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create tank');
    }
  };

  const handleUpdateTank = async () => {
    if (!selectedTank) return;
    try {
      await inventoryApi.updateTank(selectedTank.id, {
        name: editFormData.name,
        productType: editFormData.productType,
        capacity: parseFloat(editFormData.capacity),
        currentLevel: parseFloat(editFormData.currentLevel) || 0,
      });
      toast.success('Tank updated successfully');
      setShowEditModal(false);
      fetchTanks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update tank');
    }
  };

  const handleDeleteTank = async () => {
    if (!selectedTank) return;
    try {
      await inventoryApi.deleteTank(selectedTank.id);
      toast.success('Tank deleted successfully');
      setShowDeleteModal(false);
      fetchTanks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete tank');
    }
  };

  const resetForm = () => {
    setFormData({ name: '', productType: 'PMS', capacity: '', currentLevel: '' });
    setErrors({});
  };

  const openEditModal = (tank: Tank) => {
    setSelectedTank(tank);
    setEditFormData({
      name: tank.name,
      productType: tank.productType,
      capacity: tank.capacity.toString(),
      currentLevel: tank.currentLevel.toString(),
    });
    setShowEditModal(true);
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tank Management</h1>
          <p className="text-gray-500">Manage fuel storage tanks and inventory</p>
        </div>
        <div className="flex items-center gap-3">
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              <Plus size={18} />
              Add Tank
            </button>
          )}
          <button
            onClick={fetchTanks}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Station Selector */}
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
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Tanks</p>
          <p className="text-2xl font-bold text-gray-900">{tanks.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Capacity</p>
          <p className="text-2xl font-bold text-blue-600">
            {formatNumber(tanks.reduce((sum, t) => sum + t.capacity, 0))} L
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Current Stock</p>
          <p className="text-2xl font-bold text-green-600">
            {formatNumber(tanks.reduce((sum, t) => sum + t.currentLevel, 0))} L
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Avg Fill Level</p>
          <p className="text-2xl font-bold text-purple-600">
            {tanks.length > 0 
              ? `${(tanks.reduce((sum, t) => sum + t.percentage, 0) / tanks.length).toFixed(1)}%` 
              : '0%'}
          </p>
        </div>
      </div>

      {/* Tank Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tanks.map((tank) => (
          <div
            key={tank.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getStatusBadge(tank.status)}`}>
                  {getStatusIcon(tank.status)}
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{tank.name}</h3>
                  <p className="text-sm text-gray-500">{tank.productType}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(tank.status)}`}>
                {tank.status}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Capacity</span>
                <span className="font-medium">{formatNumber(tank.capacity)} L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Current Level</span>
                <span className="font-medium">{formatNumber(tank.currentLevel)} L</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Fill Level</span>
                <span className="font-medium">{tank.percentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full ${
                    tank.percentage > 30 ? 'bg-green-500' :
                    tank.percentage > 15 ? 'bg-yellow-500' :
                    'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(tank.percentage, 100)}%` }}
                />
              </div>
            </div>

            {canManage && (
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                <button
                  onClick={() => openEditModal(tank)}
                  className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-1"
                >
                  <Edit size={16} />
                  Edit
                </button>
                <button
                  onClick={() => {
                    setSelectedTank(tank);
                    setShowDeleteModal(true);
                  }}
                  className="px-4 py-2 text-sm border border-red-200 text-red-600 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {tanks.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-200">
          <Fuel className="mx-auto text-gray-400 mb-4" size={48} />
          <p className="text-gray-500">No tanks found for this station</p>
          {canManage && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              <Plus size={18} className="inline mr-2" />
              Add Tank
            </button>
          )}
        </div>
      )}

      {/* Create Tank Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Add New Tank"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateTank(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tank Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              placeholder="e.g., PMS Tank 1"
            />
            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Type *</label>
            <select
              value={formData.productType}
              onChange={(e) => setFormData({ ...formData, productType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value="PMS">PMS (Premium)</option>
              <option value="AGO">AGO (Diesel)</option>
              <option value="DPK">DPK (Kerosene)</option>
              <option value="LPG">LPG (Gas)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (L) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.capacity}
              onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.capacity ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              placeholder="0.00"
            />
            {errors.capacity && <p className="mt-1 text-sm text-red-500">{errors.capacity}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Level (L)</label>
            <input
              type="number"
              step="0.01"
              value={formData.currentLevel}
              onChange={(e) => setFormData({ ...formData, currentLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              placeholder="0.00"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => { setShowCreateModal(false); resetForm(); }} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium">
              <Save size={18} /> Create Tank
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Tank Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Tank: ${selectedTank?.name}`}
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateTank(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tank Name *</label>
            <input
              type="text"
              value={editFormData.name}
              onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Type *</label>
            <select
              value={editFormData.productType}
              onChange={(e) => setEditFormData({ ...editFormData, productType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value="PMS">PMS (Premium)</option>
              <option value="AGO">AGO (Diesel)</option>
              <option value="DPK">DPK (Kerosene)</option>
              <option value="LPG">LPG (Gas)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Capacity (L) *</label>
            <input
              type="number"
              step="0.01"
              value={editFormData.capacity}
              onChange={(e) => setEditFormData({ ...editFormData, capacity: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Current Level (L)</label>
            <input
              type="number"
              step="0.01"
              value={editFormData.currentLevel}
              onChange={(e) => setEditFormData({ ...editFormData, currentLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => setShowEditModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium">
              <Save size={18} /> Update Tank
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Tank"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete tank <strong>{selectedTank?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
            <button onClick={handleDeleteTank} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">Delete</button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TankManagement;