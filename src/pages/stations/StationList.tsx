import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { stationsApi } from '../../api/stations';
import { usersApi } from '../../api/users';
import { 
  Plus, Search, Filter, ChevronRight, 
  MapPin, Users, Fuel, Edit, Trash2,
  Eye
} from 'lucide-react';
import { Station } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const StationList: React.FC = () => {
  const navigate = useNavigate();
  const [stations, setStations] = useState<Station[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  useEffect(() => {
    fetchStations();
  }, [currentPage, searchTerm]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      const data = await stationsApi.getAll();
      setStations(data);
      setTotalPages(Math.ceil(data.length / 10));
    } catch (error) {
      console.error('Error fetching stations:', error);
      toast.error('Failed to load stations');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStation) return;
    try {
      await stationsApi.delete(selectedStation.id);
      toast.success('Station deleted successfully');
      setShowDeleteModal(false);
      fetchStations();
    } catch (error) {
      toast.error('Failed to delete station');
    }
  };

  const filteredStations = stations.filter(station =>
    station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedStations = filteredStations.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Stations</h1>
          <p className="text-gray-500">Manage all station locations and operations</p>
        </div>
        <button
          onClick={() => navigate('/stations/management')}
          className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
        >
          <Plus size={18} />
          Add Station
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search stations by name, code, or city..."
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <Filter size={18} />
          Filters
        </button>
      </div>

      {/* Station Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedStations.map((station) => (
          <div
            key={station.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-shadow overflow-hidden"
          >
            <div className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{station.name}</h3>
                  <p className="text-sm text-gray-500">{station.code}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  station.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {station.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin size={16} className="text-gray-400" />
                  <span>{station.address}, {station.city}, {station.state}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Users size={16} className="text-gray-400" />
                  <span>Manager: {station.manager?.firstName || 'Not assigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Fuel size={16} className="text-gray-400" />
                  <span>Tanks: {station.tanks?.length || 0} | Pumps: {station.pumps?.length || 0}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-500">Total Sales</p>
                  <p className="text-lg font-bold text-gray-900">{formatCurrency(station.totalSales || 0)}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(`/stations/${station.id}`)}
                    className="p-2 text-gray-500 hover:text-petroleum-seagreen transition-colors"
                    title="View Details"
                  >
                    <Eye size={18} />
                  </button>
                  <button
                    onClick={() => navigate(`/stations/management?id=${station.id}`)}
                    className="p-2 text-gray-500 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit size={18} />
                  </button>
                  <button
                    onClick={() => {
                      setSelectedStation(station);
                      setShowDeleteModal(true);
                    }}
                    className="p-2 text-gray-500 hover:text-red-600 transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
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

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Station"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete <strong>{selectedStation?.name}</strong>?
            This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default StationList;