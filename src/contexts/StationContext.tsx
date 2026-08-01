import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
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
  
  // Use refs to prevent multiple fetches
  const hasFetched = useRef<boolean>(false);
  const isFetching = useRef<boolean>(false);
  const fetchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isSuperAdmin = user?.role === UserRole.SUPER_ADMIN;
  const isRegionalManager = user?.role === UserRole.REGIONAL_MANAGER;
  const isSupervisor = user?.role === UserRole.SUPERVISOR;
  const isAllStations = selectedStationId === '' && isSuperAdmin;

  const fetchStations = async () => {
    // Prevent multiple simultaneous fetches
    if (isFetching.current) {
      console.log('⏳ [StationProvider] Fetch already in progress, skipping...');
      return;
    }

    try {
      isFetching.current = true;
      setLoading(true);
      
      console.log('📡 [StationProvider] Fetching stations...');
      let stationData = await stationsApi.getAll();
      
      // Filter stations based on role
      if (isRegionalManager && user?.regionId) {
        stationData = stationData.filter(s => s.regionId === user.regionId);
      } else if (isSupervisor && user?.stationId) {
        stationData = stationData.filter(s => s.id === user.stationId);
      }
      
      setStations(stationData);
      
      // Only set selected station if not already set
      if (stationData.length > 0 && selectedStationId === null) {
        let newSelectedId: string | null = null;
        
        if (isSuperAdmin) {
          newSelectedId = '';
        } else if (isRegionalManager) {
          newSelectedId = stationData[0].id;
        } else if (isSupervisor && user?.stationId) {
          newSelectedId = user.stationId;
        } else if (user?.stationId) {
          newSelectedId = user.stationId;
        } else {
          newSelectedId = stationData[0].id;
        }
        
        setSelectedStationId(newSelectedId);
      } else if (stationData.length === 0) {
        setSelectedStationId(null);
      }
      
      hasFetched.current = true;
    } catch (error) {
      console.error('Error fetching stations:', error);
      setSelectedStationId(null);
    } finally {
      setLoading(false);
      isFetching.current = false;
    }
  };

  useEffect(() => {
    // Only fetch once when user is available and not already fetched
    if (user && !hasFetched.current && !isFetching.current) {
      // Add a small delay to prevent race conditions
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
      }
      
      fetchTimeoutRef.current = setTimeout(() => {
        fetchStations();
        fetchTimeoutRef.current = null;
      }, 100);
    }

    // Cleanup timeout on unmount
    return () => {
      if (fetchTimeoutRef.current) {
        clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = null;
      }
    };
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