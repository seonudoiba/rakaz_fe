import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { stationsApi } from '../api/stations';
import { UserRole } from '../types';

interface StationContextType {
  stations: any[];
  selectedStationId: string | null;
  setSelectedStationId: (id: string) => void;
  loading: boolean;
  isSuperAdmin: boolean;
  isRegionalManager: boolean;
  isSupervisor: boolean;
  hasStation: boolean;
  refreshStations: () => Promise<void>;
  getFilteredStations: () => any[];
  isAllStations: boolean;
}

const StationContext = createContext<StationContextType | undefined>(undefined);

export const StationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isRegionalManager = user?.role === UserRole.REGIONAL_MANAGER;
  const isSupervisor = user?.role === UserRole.SUPERVISOR;
  
  // Empty string means "All Stations" for Super Admin
  const isAllStations = selectedStationId === '' && isSuperAdmin;

  const fetchStations = async () => {
    try {
      setLoading(true);
      
      let stationData = await stationsApi.getAll();
      
      // Filter stations based on role
      if (isRegionalManager && user?.regionId) {
        // Regional Manager only sees stations in their region
        stationData = stationData.filter(s => s.regionId === user.regionId);
      } else if (isSupervisor && user?.stationId) {
        // Supervisor only sees their own station
        stationData = stationData.filter(s => s.id === user.stationId);
      }
      // Super Admin sees all stations
      
      setStations(stationData);
      
      // Auto-select station based on role
      if (stationData.length > 0) {
        if (isSuperAdmin) {
          // Super Admin defaults to "All Stations"
          setSelectedStationId('');  // Empty string = All Stations
        } else if (isRegionalManager) {
          // Regional Manager selects the first station in their region
          setSelectedStationId(stationData[0].id);
        } else if (isSupervisor && user?.stationId) {
          // Supervisor selects their assigned station
          setSelectedStationId(user.stationId);
        } else if (user?.stationId) {
          // Other roles with station assigned
          setSelectedStationId(user.stationId);
        } else {
          // Fallback: select first station
          setSelectedStationId(stationData[0].id);
        }
      } else {
        setSelectedStationId(null);
      }
    } catch (error) {
      console.error('Error fetching stations:', error);
      setSelectedStationId(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStations();
    } else {
      // If no user, still set loading to false
      setLoading(false);
    }
  }, [user]);

  const getFilteredStations = () => {
    if (isSuperAdmin) {
      return stations;
    } else if (isRegionalManager && user?.regionId) {
      return stations.filter(s => s.regionId === user.regionId);
    } else if (isSupervisor && user?.stationId) {
      return stations.filter(s => s.id === user.stationId);
    }
    return stations;
  };

  // Memoize the context value to prevent unnecessary re-renders
  const value = useMemo(() => ({
    stations,
    selectedStationId,
    setSelectedStationId,
    loading,
    isSuperAdmin,
    isRegionalManager,
    isSupervisor,
    hasStation: !!selectedStationId || isAllStations,
    refreshStations: fetchStations,
    getFilteredStations,
    isAllStations,
  }), [stations, selectedStationId, loading, isSuperAdmin, isRegionalManager, isSupervisor, isAllStations]);

  return (
    <StationContext.Provider value={value}>
      {children}
    </StationContext.Provider>
  );
};

export const useStation = () => {
  const context = useContext(StationContext);
  if (!context) {
    throw new Error('useStation must be used within a StationProvider');
  }
  return context;
};