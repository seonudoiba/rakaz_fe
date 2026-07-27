import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { logisticsApi } from '../../api/logistics';
import {
  RefreshCw, Search, Plus, Truck, MapPin,
  CheckCircle, Clock, AlertCircle, Wrench,
  Fuel, Calendar, User, Phone
} from 'lucide-react';
import { formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const FleetManagement: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [fleetData, setFleetData] = useState<any>(null);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => {
    fetchFleetData();
  }, []);

  const fetchFleetData = async () => {
    try {
      setLoading(true);
      const data = await logisticsApi.getFleetStatus();
      setFleetData(data);
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Error fetching fleet data:', error);
      toast.error('Failed to load fleet data');
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(vehicle =>
    vehicle.tankerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    vehicle.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors = {
      AVAILABLE: 'bg-green-100 text-green-700',
      IN_TRANSIT: 'bg-blue-100 text-blue-700',
      MAINTENANCE: 'bg-yellow-100 text-yellow-700',
      REPAIR: 'bg-red-100 text-red-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'AVAILABLE': return <CheckCircle className="text-green-600" size={16} />;
      case 'IN_TRANSIT': return <Truck className="text-blue-600" size={16} />;
      case 'MAINTENANCE': return <Wrench className="text-yellow-600" size={16} />;
      case 'REPAIR': return <AlertCircle className="text-red-600" size={16} />;
      default: return <AlertCircle className="text-gray-600" size={16} />;
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fleet Management</h1>
          <p className="text-gray-500">Manage vehicles, drivers, and fleet operations</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Vehicle
          </button>
          <button
            onClick={fetchFleetData}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Total Vehicles</p>
          <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Available</p>
          <p className="text-2xl font-bold text-green-600">
            {vehicles.filter(v => v.status === 'AVAILABLE').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">In Transit</p>
          <p className="text-2xl font-bold text-blue-600">
            {vehicles.filter(v => v.status === 'IN_TRANSIT').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Maintenance</p>
          <p className="text-2xl font-bold text-yellow-600">
            {vehicles.filter(v => v.status === 'MAINTENANCE').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Active Drivers</p>
          <p className="text-2xl font-bold text-purple-600">
            {vehicles.filter(v => v.driverName).length}
          </p>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search by tanker ID, driver, or status..."
      />

      {/* Vehicle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.id} className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{vehicle.tankerId}</h3>
                <p className="text-sm text-gray-500">{vehicle.model || 'Unknown Model'}</p>
              </div>
              <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vehicle.status)}`}>
                {getStatusIcon(vehicle.status)}
                {vehicle.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <User size={16} className="text-gray-400" />
                <span>Driver: {vehicle.driverName || 'Not assigned'}</span>
              </div>
              {vehicle.driverPhone && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Phone size={16} className="text-gray-400" />
                  <span>{vehicle.driverPhone}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Fuel size={16} className="text-gray-400" />
                <span>Fuel: {formatNumber(vehicle.fuelLevel || 0)} L</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar size={16} className="text-gray-400" />
                <span>Last Service: {vehicle.lastService ? formatDate(vehicle.lastService) : 'N/A'}</span>
              </div>
              {vehicle.currentLocation && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{vehicle.currentLocation}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
              <button
                onClick={() => {
                  setSelectedVehicle(vehicle);
                  setShowDetailsModal(true);
                }}
                className="flex-1 px-4 py-2 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View Details
              </button>
              <button className="flex-1 px-4 py-2 text-sm bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors">
                Assign
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Vehicle Modal */}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Add New Vehicle"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); setShowAddModal(false); toast.success('Vehicle added successfully'); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tanker ID *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              placeholder="e.g., TKR-001"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              placeholder="e.g., Mercedes Actros"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Name
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              placeholder="Full name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Driver Phone
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              placeholder="+234 800 000 0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fuel Capacity (L)
            </label>
            <input
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              placeholder="5000"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowAddModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              Add Vehicle
            </button>
          </div>
        </form>
      </Modal>

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Vehicle Details"
        size="lg"
      >
        {selectedVehicle && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Tanker ID</p>
                <p className="font-bold text-lg">{selectedVehicle.tankerId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedVehicle.status)}`}>
                  {getStatusIcon(selectedVehicle.status)}
                  {selectedVehicle.status.replace('_', ' ')}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium">{selectedVehicle.model || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">License Plate</p>
                <p className="font-medium">{selectedVehicle.licensePlate || 'N/A'}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Driver</p>
                <p className="font-medium">{selectedVehicle.driverName || 'Not assigned'}</p>
                {selectedVehicle.driverPhone && (
                  <p className="text-sm text-gray-500">{selectedVehicle.driverPhone}</p>
                )}
              </div>
              <div>
                <p className="text-sm text-gray-500">Fuel Level</p>
                <p className="font-medium">{formatNumber(selectedVehicle.fuelLevel || 0)} L</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Last Service</p>
                <p className="font-medium">{selectedVehicle.lastService ? formatDate(selectedVehicle.lastService) : 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Current Location</p>
                <p className="font-medium">{selectedVehicle.currentLocation || 'Unknown'}</p>
              </div>
            </div>

            <div>
              <p className="text-sm text-gray-500">Total Deliveries</p>
              <p className="font-medium">{selectedVehicle.deliveryCount || 0}</p>
            </div>

            <div className="pt-4 border-t border-gray-200 flex gap-3">
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                Assign Delivery
              </button>
              <button className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                Schedule Maintenance
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FleetManagement;