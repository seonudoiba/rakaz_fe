import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useStation } from '../../contexts/StationContext';
import { Building, ChevronDown, RefreshCw, Layers, Check } from 'lucide-react';
import { stationsApi } from '../../api/stations';
import toast from 'react-hot-toast';

interface StationSelectorProps {
  className?: string;
  onStationChange?: (stationId: string) => void;
  showRefresh?: boolean;
}

const StationSelector: React.FC<StationSelectorProps> = ({
  className = '',
  onStationChange,
  showRefresh = true,
}) => {
  const { user } = useAuth();
  const { 
    stations, 
    selectedStationId, 
    setSelectedStationId, 
    isSuperAdmin,
    isRegionalManager,
    isSupervisor,
    refreshStations,
    loading,
    isAllStations
  } = useStation();

  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Get filtered stations based on role
  const getFilteredStations = () => {
    if (isSuperAdmin) {
      // Super Admin sees all stations
      return stations;
    } else if (isRegionalManager && user?.regionId) {
      // Regional Manager only sees stations in their region
      return stations.filter(station => station.regionId === user.regionId);
    } else if (isSupervisor && user?.stationId) {
      // Supervisor only sees their own station
      return stations.filter(station => station.id === user.stationId);
    }
    return stations;
  };

  const filteredStations = getFilteredStations();

  // Get current station name
  const currentStation = stations.find(s => s.id === selectedStationId);
  const currentStationName = currentStation?.name || 'All Stations';
  const currentStationCode = currentStation?.code || '';

  const handleStationSelect = (stationId: string) => {
    setSelectedStationId(stationId);
    setIsOpen(false);
    if (onStationChange) {
      onStationChange(stationId);
    }
  };

  const handleRefresh = async () => {
    await refreshStations();
    toast.success('Stations refreshed');
  };

  // Auto-select first station or "All Stations"
  useEffect(() => {
    // Only run if not loading and stations are available
    if (!loading && filteredStations.length > 0) {
      // If no station is selected yet
      if (selectedStationId === null || selectedStationId === undefined) {
        if (isSuperAdmin) {
          // Super Admin defaults to "All Stations" (empty string)
          setSelectedStationId('');
        } else {
          // For other roles, select the first available station
          setSelectedStationId(filteredStations[0].id);
        }
      }
      
      // If selected station is not in filtered stations (e.g., station was removed)
      if (selectedStationId && !filteredStations.some(s => s.id === selectedStationId)) {
        if (isSuperAdmin) {
          setSelectedStationId('');
        } else if (filteredStations.length > 0) {
          setSelectedStationId(filteredStations[0].id);
        }
      }
    }
  }, [filteredStations, selectedStationId, setSelectedStationId, isSuperAdmin, loading]);

  // If no stations available
  if (!loading && filteredStations.length === 0) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-500 ${className}`}>
        <Building size={18} />
        <span className="text-sm">No stations available</span>
      </div>
    );
  }

  // If loading
  if (loading) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-500 ${className}`}>
        <RefreshCw size={18} className="animate-spin" />
        <span className="text-sm">Loading stations...</span>
      </div>
    );
  }

  // If only one station and not Super Admin (or Super Admin with one station)
  if (filteredStations.length === 1 && !isSuperAdmin) {
    return (
      <div className={`flex items-center gap-2 px-3 py-1.5 bg-petroleum-seagreen/10 rounded-lg border border-petroleum-seagreen/20 ${className}`}>
        <Building size={18} className="text-petroleum-seagreen" />
        <span className="text-sm font-medium text-gray-700">
          {filteredStations[0].name}
        </span>
        <span className="text-xs text-gray-400">({filteredStations[0].code})</span>
        {showRefresh && (
          <button
            onClick={handleRefresh}
            className="ml-2 p-1 hover:bg-gray-200 rounded transition-colors"
            title="Refresh stations"
          >
            <RefreshCw size={14} className="text-gray-400" />
          </button>
        )}
      </div>
    );
  }

  // Super Admin with multiple stations or Regional Manager with multiple stations - show dropdown
  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg hover:border-petroleum-seagreen transition-colors min-w-[200px]"
      >
        {isAllStations ? (
          <Layers size={18} className="text-petroleum-seagreen flex-shrink-0" />
        ) : (
          <Building size={18} className="text-petroleum-seagreen flex-shrink-0" />
        )}
        <span className="flex-1 text-sm font-medium text-gray-700 truncate">
          {isAllStations ? 'All Stations' : currentStationName}
        </span>
        {!isAllStations && currentStationCode && (
          <span className="text-xs text-gray-400">({currentStationCode})</span>
        )}
        {isAllStations && (
          <span className="text-xs text-petroleum-seagreen font-medium">
            ({filteredStations.length})
          </span>
        )}
        <ChevronDown size={16} className={`text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg z-50 max-h-80 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-gray-100">
            <input
              type="text"
              placeholder="Search stations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Station List */}
          <div className="overflow-y-auto max-h-60">
            {/* "All Stations" option - only for Super Admin */}
            {isSuperAdmin && (
              <button
                onClick={() => handleStationSelect('')}
                className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left ${
                  isAllStations ? 'bg-petroleum-seagreen/10 border-l-2 border-petroleum-seagreen' : ''
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-petroleum-seagreen" />
                  <span className="font-medium">All Stations</span>
                  <span className="text-xs text-gray-400">({filteredStations.length})</span>
                </div>
                {isAllStations && (
                  <Check size={16} className="text-petroleum-seagreen" />
                )}
              </button>
            )}

            {/* Individual Stations */}
            {filteredStations
              .filter(station => 
                station.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                station.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                station.city?.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((station) => (
                <button
                  key={station.id}
                  onClick={() => handleStationSelect(station.id)}
                  className={`w-full flex items-center justify-between px-4 py-2.5 text-sm hover:bg-gray-50 transition-colors text-left ${
                    station.id === selectedStationId ? 'bg-petroleum-seagreen/10 border-l-2 border-petroleum-seagreen' : ''
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Building size={16} className="text-gray-400 flex-shrink-0" />
                      <span className="font-medium truncate">{station.name}</span>
                      <span className="text-xs text-gray-400">({station.code})</span>
                    </div>
                    <div className="text-xs text-gray-400 truncate ml-6">
                      {station.city}, {station.state}
                    </div>
                  </div>
                  {station.id === selectedStationId && (
                    <Check size={16} className="text-petroleum-seagreen ml-2 flex-shrink-0" />
                  )}
                </button>
              ))}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
            <span>
              {isAllStations 
                ? `All Stations (${filteredStations.length})` 
                : `${filteredStations.length} station${filteredStations.length !== 1 ? 's' : ''}`
              }
            </span>
            {showRefresh && (
              <button
                onClick={handleRefresh}
                className="flex items-center gap-1 text-petroleum-seagreen hover:underline"
              >
                <RefreshCw size={12} />
                Refresh
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default StationSelector;