import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { stationsApi } from '../api/stations';

export const useStation = () => {
  const { user } = useAuth();
  const [stations, setStations] = useState<any[]>([]);
  const [selectedStationId, setSelectedStationId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const init = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      if (user.role === 'SUPER_ADMIN') {
        setIsSuperAdmin(true);
        try {
          const data = await stationsApi.getAll();
          setStations(data);
          if (data.length > 0) {
            setSelectedStationId(data[0].id);
          }
        } catch (error) {
          console.error('Error fetching stations:', error);
        }
      } else if (user.stationId) {
        setSelectedStationId(user.stationId);
      }
      setLoading(false);
    };

    init();
  }, [user]);

  return {
    stations,
    selectedStationId,
    setSelectedStationId,
    loading,
    isSuperAdmin,
    hasStation: !!selectedStationId,
  };
};