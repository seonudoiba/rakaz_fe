import React, { useState, useEffect } from "react";
import { useAuth } from "../../hooks/useAuth";
import { pumpsApi } from "../../api/pumps";
import { stationsApi } from "../../api/stations";
import {
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Power,
  PowerOff,
  Fuel,
  Calendar,
  Eye,
  X,
  Save,
  AlertTriangle,
} from "lucide-react";
import { Pump } from "../../types";
import { formatNumber, formatDateTime } from "../../utils/formatters";
import Loader from "../../components/common/Loader";
import SearchBar from "../../components/common/SearchBar";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

const PumpManagement: React.FC = () => {
  const { user } = useAuth();
  const [pumps, setPumps] = useState<Pump[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showReadingsModal, setShowReadingsModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedPump, setSelectedPump] = useState<Pump | null>(null);
  const [readings, setReadings] = useState<any[]>([]);
  const [loadingReadings, setLoadingReadings] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [pumpToDelete, setPumpToDelete] = useState<Pump | null>(null);

  // State for station selection
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>("");

  // Form state
  const [formData, setFormData] = useState({
    pumpNumber: "",
    productType: "PMS",
    openingMeter: 0,
  });

  const [editFormData, setEditFormData] = useState({
    pumpNumber: "",
    productType: "PMS",
    openingMeter: 0,
    closingMeter: 0,
    isActive: true,
  });

  // Check user roles
  const isSuperAdmin = user?.role === "SUPER_ADMIN";
  const isRegionalManager = user?.role === "REGIONAL_MANAGER";
  const isSupervisor = user?.role === "SUPERVISOR";
  
  // Users who can select stations
  const canSelectStation = isSuperAdmin || isRegionalManager || isSupervisor;

  // Load data based on user role
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        if (isSuperAdmin) {
          // Super Admin: Fetch all stations and select first one
          const stationsData = await stationsApi.getAll();
          setStations(stationsData);
          
          if (stationsData.length > 0) {
            setSelectedStationId(stationsData[0].id);
            await fetchPumps(stationsData[0].id);
          } else {
            toast.error("No stations found");
            setLoading(false);
          }
        } else if (isRegionalManager) {
          // Regional Manager: Fetch stations in their region
          // The API should filter by regionId automatically based on user's region
          const stationsData = await stationsApi.getAll();
          setStations(stationsData);
          
          if (stationsData.length > 0) {
            setSelectedStationId(stationsData[0].id);
            await fetchPumps(stationsData[0].id);
          } else {
            toast.error("No stations found in your region");
            setLoading(false);
          }
        } else if (isSupervisor && user?.stationId) {
          // Supervisor: Only has one station
          setSelectedStationId(user.stationId);
          await fetchPumps(user.stationId);
        } else if (user?.stationId) {
          // Other roles with station assigned (Attendant, etc.)
          setSelectedStationId(user.stationId);
          await fetchPumps(user.stationId);
        } else {
          // No station assigned
          toast.error("No station assigned to your account");
          setLoading(false);
        }
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const fetchPumps = async (stationId: string) => {
    try {
      setLoading(true);
      const data = await pumpsApi.getStationPumps(stationId);
      setPumps(data);
    } catch (error) {
      console.error("Error fetching pumps:", error);
      toast.error("Failed to load pumps");
    } finally {
      setLoading(false);
    }
  };

  const handleStationChange = (stationId: string) => {
    setSelectedStationId(stationId);
    fetchPumps(stationId);
  };

  const handleDeleteClick = (pump: Pump) => {
    setPumpToDelete(pump);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!pumpToDelete) return;

    try {
      await pumpsApi.delete(pumpToDelete.id);
      toast.success(`Pump #${pumpToDelete.pumpNumber} deleted successfully`);
      setShowDeleteModal(false);
      setPumpToDelete(null);
      fetchPumps(selectedStationId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete pump");
    }
  };

  // ============= CREATE PUMP =============
  const handleCreatePump = async () => {
    try {
      if (!selectedStationId) {
        toast.error("No station selected");
        return;
      }

      const data = {
        ...formData,
        pumpNumber: parseInt(formData.pumpNumber),
        stationId: selectedStationId,
      };

      await pumpsApi.create(data);
      toast.success("Pump created successfully");
      setShowCreateModal(false);
      fetchPumps(selectedStationId);
      setFormData({ pumpNumber: "", productType: "PMS", openingMeter: 0 });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create pump");
    }
  };

  // ============= EDIT PUMP =============
  const handleEditClick = (pump: Pump) => {
    setSelectedPump(pump);
    setEditFormData({
      pumpNumber: String(pump.pumpNumber),
      productType: pump.productType,
      openingMeter: pump.openingMeter,
      closingMeter: pump.closingMeter,
      isActive: pump.isActive,
    });
    setShowEditModal(true);
  };

  const handleUpdatePump = async () => {
    try {
      if (!selectedPump) return;

      const data = {
        pumpNumber: parseInt(editFormData.pumpNumber),
        productType: editFormData.productType,
        openingMeter: editFormData.openingMeter,
        closingMeter: editFormData.closingMeter,
        isActive: editFormData.isActive,
      };

      await pumpsApi.update(selectedPump.id, data);
      toast.success("Pump updated successfully");
      setShowEditModal(false);
      fetchPumps(selectedStationId);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update pump");
    }
  };

  // ============= DEACTIVATE/ACTIVATE PUMP =============
  const handleTogglePump = async (pump: Pump) => {
    try {
      const newStatus = !pump.isActive;
      await pumpsApi.update(pump.id, { isActive: newStatus });
      toast.success(
        `Pump ${newStatus ? "activated" : "deactivated"} successfully`,
      );
      fetchPumps(selectedStationId);
    } catch (error) {
      toast.error("Failed to update pump status");
    }
  };

  const handleDeactivateClick = (pump: Pump) => {
    setSelectedPump(pump);
    setShowDeactivateModal(true);
  };

  const handleConfirmDeactivate = async () => {
    if (!selectedPump) return;
    try {
      await pumpsApi.update(selectedPump.id, { isActive: false });
      toast.success("Pump deactivated successfully");
      setShowDeactivateModal(false);
      fetchPumps(selectedStationId);
    } catch (error) {
      toast.error("Failed to deactivate pump");
    }
  };

  // ============= VIEW READINGS =============
  const handleViewReadings = async (pump: Pump) => {
    try {
      setSelectedPump(pump);
      setLoadingReadings(true);
      setShowReadingsModal(true);

      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      const data = await pumpsApi.getReadings(
        pump.id,
        startDate.toISOString(),
        endDate.toISOString(),
      );
      setReadings(data);
    } catch (error) {
      console.error("Error fetching readings:", error);
      toast.error("Failed to load pump readings");
      setShowReadingsModal(false);
    } finally {
      setLoadingReadings(false);
    }
  };

  const filteredPumps = pumps.filter(
    (pump) =>
      pump.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pump.pumpNumber.toString().includes(searchTerm),
  );

  if (loading) return <Loader />;

  // Calculate totals for readings
  const totalLitres = readings.reduce((sum, r) => sum + r.litresSold, 0);
  const totalRevenue = readings.reduce((sum, r) => sum + r.expectedRevenue, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pump Management</h1>
          <p className="text-gray-500">
            Manage fuel pumps and monitor readings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {(isSuperAdmin || isRegionalManager) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              <Plus size={18} />
              Add Pump
            </button>
          )}
          <button
            onClick={() => fetchPumps(selectedStationId)}
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
            value={selectedStationId}
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

      {/* Show current station info for non-selectable users */}
      {!canSelectStation && selectedStationId && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-600">
            <span className="font-medium">Current Station:</span>{" "}
            {stations.find(s => s.id === selectedStationId)?.name || "Loading..."}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Fuel className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total Pumps</p>
              <p className="text-2xl font-bold text-gray-900">{pumps.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Power className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Active</p>
              <p className="text-2xl font-bold text-green-600">
                {pumps.filter((p) => p.isActive).length}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <PowerOff className="text-red-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Inactive</p>
              <p className="text-2xl font-bold text-red-600">
                {pumps.filter((p) => !p.isActive).length}
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
              <p className="text-sm text-gray-500">Total Readings</p>
              <p className="text-2xl font-bold text-purple-600">
                {pumps.reduce((sum, p) => sum + (p.readings?.length || 0), 0)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <SearchBar
        value={searchTerm}
        onChange={setSearchTerm}
        placeholder="Search by pump number or product type..."
      />

      {/* Pump Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPumps.map((pump) => (
          <div
            key={pump.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  Pump #{pump.pumpNumber}
                </h3>
                <p className="text-sm text-gray-500">{pump.productType}</p>
              </div>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${
                  pump.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {pump.isActive ? "Active" : "Inactive"}
              </span>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Opening Meter</span>
                <span className="font-medium">
                  {formatNumber(pump.openingMeter)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Closing Meter</span>
                <span className="font-medium">
                  {formatNumber(pump.closingMeter)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Sales</span>
                <span className="font-medium">{pump.sales?.length || 0}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
              <button
                onClick={() => handleViewReadings(pump)}
                className="text-sm text-petroleum-seagreen hover:underline flex items-center gap-1"
              >
                <Eye size={14} />
                View Readings
              </button>
              <div className="flex gap-2">
                {(isSuperAdmin || isRegionalManager || isSupervisor) && (
                  <button
                    onClick={() => handleTogglePump(pump)}
                    className={`p-2 rounded-lg transition-colors ${
                      pump.isActive
                        ? "text-red-500 hover:bg-red-50"
                        : "text-green-500 hover:bg-green-50"
                    }`}
                    title={pump.isActive ? "Deactivate" : "Activate"}
                  >
                    {pump.isActive ? <PowerOff size={18} /> : <Power size={18} />}
                  </button>
                )}
                {(isSuperAdmin || isRegionalManager) && (
                  <>
                    <button
                      onClick={() => handleEditClick(pump)}
                      className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                      title="Edit"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(pump)}
                      className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {filteredPumps.length === 0 && !loading && (
        <div className="text-center py-12">
          <Fuel className="mx-auto text-gray-400 mb-4" size={48} />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No pumps found</h3>
          <p className="text-gray-500">
            {searchTerm ? "Try adjusting your search" : "Add your first pump to get started"}
          </p>
          {!searchTerm && (isSuperAdmin || isRegionalManager) && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="mt-4 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              <Plus size={18} className="inline mr-2" />
              Add Pump
            </button>
          )}
        </div>
      )}

      {/* ============= CREATE PUMP MODAL ============= */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Add New Pump"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleCreatePump();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pump Number *
            </label>
            <input
              type="number"
              min="1"
              value={formData.pumpNumber}
              onChange={(e) =>
                setFormData({ ...formData, pumpNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type *
            </label>
            <select
              value={formData.productType}
              onChange={(e) =>
                setFormData({ ...formData, productType: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value="PMS">PMS (Premium)</option>
              <option value="AGO">AGO (Diesel)</option>
              <option value="DPK">DPK (Kerosene)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Opening Meter Reading
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.openingMeter}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  openingMeter: parseFloat(e.target.value),
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              Add Pump
            </button>
          </div>
        </form>
      </Modal>

      {/* ============= EDIT PUMP MODAL ============= */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={`Edit Pump #${selectedPump?.pumpNumber}`}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleUpdatePump();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pump Number *
            </label>
            <input
              type="number"
              min="1"
              value={editFormData.pumpNumber}
              onChange={(e) =>
                setEditFormData({ ...editFormData, pumpNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type *
            </label>
            <select
              value={editFormData.productType}
              onChange={(e) =>
                setEditFormData({
                  ...editFormData,
                  productType: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value="PMS">PMS (Premium)</option>
              <option value="AGO">AGO (Diesel)</option>
              <option value="DPK">DPK (Kerosene)</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Opening Meter
              </label>
              <input
                type="number"
                step="0.01"
                value={editFormData.openingMeter}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    openingMeter: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Closing Meter
              </label>
              <input
                type="number"
                step="0.01"
                value={editFormData.closingMeter}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    closingMeter: parseFloat(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={editFormData.isActive}
              onChange={(e) =>
                setEditFormData({ ...editFormData, isActive: e.target.checked })
              }
              className="rounded text-petroleum-seagreen focus:ring-petroleum-seagreen"
            />
            <label
              htmlFor="isActive"
              className="text-sm font-medium text-gray-700"
            >
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowEditModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              <Save size={18} className="inline mr-2" />
              Update Pump
            </button>
          </div>
        </form>
      </Modal>

      {/* ============= DEACTIVATE CONFIRM MODAL ============= */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title="Deactivate Pump"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-yellow-600 bg-yellow-50 p-4 rounded-lg">
            <AlertTriangle size={24} />
            <p className="font-medium">
              Are you sure you want to deactivate this pump?
            </p>
          </div>
          {selectedPump && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>
                <strong>Pump #:</strong> {selectedPump.pumpNumber}
              </p>
              <p>
                <strong>Product:</strong> {selectedPump.productType}
              </p>
              <p>
                <strong>Current Status:</strong>{" "}
                {selectedPump.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          )}
          <p className="text-sm text-gray-500">
            Deactivated pumps will not appear in sales transactions and will be
            marked as inactive.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowDeactivateModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDeactivate}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Deactivate Pump
            </button>
          </div>
        </div>
      </Modal>

      {/* ============= VIEW READINGS MODAL ============= */}
      <Modal
        isOpen={showReadingsModal}
        onClose={() => setShowReadingsModal(false)}
        title={`Pump #${selectedPump?.pumpNumber} - Reading History`}
        size="lg"
      >
        <div className="space-y-4">
          {loadingReadings ? (
            <div className="flex justify-center py-8">
              <Loader />
            </div>
          ) : readings.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-500">
                No readings recorded for this pump
              </p>
            </div>
          ) : (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Readings</p>
                  <p className="text-xl font-bold text-gray-900">
                    {readings.length}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Litres</p>
                  <p className="text-xl font-bold text-blue-600">
                    {formatNumber(totalLitres)} L
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Total Revenue</p>
                  <p className="text-xl font-bold text-green-600">
                    ₦{formatNumber(totalRevenue)}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-sm text-gray-500">Avg per Reading</p>
                  <p className="text-xl font-bold text-purple-600">
                    {readings.length > 0
                      ? formatNumber(totalLitres / readings.length)
                      : 0}{" "}
                    L
                  </p>
                </div>
              </div>

              {/* Readings Table */}
              <div className="overflow-x-auto max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="sticky top-0 bg-gray-50">
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-sm font-medium text-gray-500 py-2 px-3">
                        Date
                      </th>
                      <th className="text-left text-sm font-medium text-gray-500 py-2 px-3">
                        Attendant
                      </th>
                      <th className="text-right text-sm font-medium text-gray-500 py-2 px-3">
                        Opening
                      </th>
                      <th className="text-right text-sm font-medium text-gray-500 py-2 px-3">
                        Closing
                      </th>
                      <th className="text-right text-sm font-medium text-gray-500 py-2 px-3">
                        Litres
                      </th>
                      <th className="text-right text-sm font-medium text-gray-500 py-2 px-3">
                        Expected
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {readings.map((reading) => (
                      <tr
                        key={reading.id}
                        className="border-b border-gray-100 hover:bg-gray-50"
                      >
                        <td className="py-2 px-3 text-sm">
                          {formatDateTime(reading.readingDate)}
                        </td>
                        <td className="py-2 px-3 text-sm">
                          {reading.attendant?.firstName}{" "}
                          {reading.attendant?.lastName}
                        </td>
                        <td className="py-2 px-3 text-sm text-right">
                          {formatNumber(reading.openingMeter)}
                        </td>
                        <td className="py-2 px-3 text-sm text-right">
                          {formatNumber(reading.closingMeter)}
                        </td>
                        <td className="py-2 px-3 text-sm text-right font-medium">
                          {formatNumber(reading.litresSold)}
                        </td>
                        <td className="py-2 px-3 text-sm text-right">
                          ₦{formatNumber(reading.expectedRevenue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 font-bold">
                    <tr>
                      <td colSpan={4} className="py-2 px-3 text-right">
                        Totals
                      </td>
                      <td className="py-2 px-3 text-right">
                        {formatNumber(totalLitres)} L
                      </td>
                      <td className="py-2 px-3 text-right">
                        ₦{formatNumber(totalRevenue)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* DELETE MODAL */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Pump"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertTriangle size={24} />
            <p className="font-medium">
              Are you sure you want to delete this pump?
            </p>
          </div>
          {pumpToDelete && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>
                <strong>Pump #:</strong> {pumpToDelete.pumpNumber}
              </p>
              <p>
                <strong>Product:</strong> {pumpToDelete.productType}
              </p>
              <p>
                <strong>Status:</strong>{" "}
                {pumpToDelete.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          )}
          <p className="text-sm text-red-500">
            ⚠️ This action cannot be undone. All associated data will be
            permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete Pump
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PumpManagement;