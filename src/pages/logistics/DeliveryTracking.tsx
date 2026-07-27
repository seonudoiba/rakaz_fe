import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { logisticsApi } from '../../api/logistics';
import {
  ArrowLeft, RefreshCw, MapPin, Truck,
  CheckCircle, Clock, AlertCircle,
  Navigation, Target
} from 'lucide-react';
import { formatDateTime, formatNumber } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const DeliveryTracking: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [locationLogs, setLocationLogs] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchTrackingData();
    }
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (id) {
        fetchTrackingData(false);
      }
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [id]);

  const fetchTrackingData = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const data = await logisticsApi.trackDelivery(id!);
      setTrackingData(data);
      setLocationLogs(data.locationLogs || []);
    } catch (error) {
      console.error('Error fetching tracking data:', error);
      toast.error('Failed to load tracking data');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading tracking data..." />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/logistics')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Delivery Tracking</h1>
            <p className="text-gray-500">Tanker ID: {trackingData?.tankerId}</p>
          </div>
        </div>
        <button
          onClick={() => fetchTrackingData(true)}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              trackingData?.status === 'DELIVERED' ? 'bg-green-50' :
              trackingData?.status === 'IN_TRANSIT' ? 'bg-blue-50' :
              trackingData?.status === 'DELAYED' ? 'bg-yellow-50' : 'bg-red-50'
            }`}>
              {trackingData?.status === 'DELIVERED' ? (
                <CheckCircle className="text-green-600" size={20} />
              ) : trackingData?.status === 'IN_TRANSIT' ? (
                <Truck className="text-blue-600" size={20} />
              ) : trackingData?.status === 'DELAYED' ? (
                <Clock className="text-yellow-600" size={20} />
              ) : (
                <AlertCircle className="text-red-600" size={20} />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-bold text-gray-900">{trackingData?.status?.replace('_', ' ')}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Target className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">ETA</p>
              <p className="font-bold text-gray-900">
                {trackingData?.eta ? formatDateTime(trackingData.eta) : 'Calculating...'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <MapPin className="text-orange-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Current Location</p>
              <p className="font-bold text-gray-900">
                {trackingData?.currentLocation || 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Navigation className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Distance</p>
              <p className="font-bold text-gray-900">
                {trackingData?.distance ? `${trackingData.distance} km` : 'Calculating...'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Placeholder - In production, integrate with Google Maps or Mapbox */}
      <div className="bg-gray-200 rounded-xl overflow-hidden h-96 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <Truck className="mx-auto text-gray-400 mb-2" size={48} />
            <p className="text-gray-500">Live tracking map</p>
            <p className="text-sm text-gray-400">Integrate with Google Maps or Mapbox</p>
          </div>
        </div>
      </div>

      {/* Location Logs */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Location History</h3>
        <div className="space-y-3">
          {locationLogs.length === 0 ? (
            <p className="text-center text-gray-500 py-8">No location updates available</p>
          ) : (
            locationLogs.slice(0, 10).map((log) => (
              <div key={log.id} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-2 h-2 mt-2 rounded-full bg-blue-500 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">Location Update</p>
                  <p className="text-sm text-gray-500">
                    Lat: {log.latitude}, Lng: {log.longitude}
                  </p>
                  <p className="text-xs text-gray-400">{formatDateTime(log.timestamp)}</p>
                  {log.notes && <p className="text-sm text-gray-600 mt-1">{log.notes}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Delivery Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Details</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Supplier</p>
            <p className="font-medium">{trackingData?.purchaseOrder?.supplierName}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Driver</p>
            <p className="font-medium">{trackingData?.driverName || 'N/A'}</p>
            {trackingData?.driverPhone && (
              <p className="text-sm text-gray-500">{trackingData.driverPhone}</p>
            )}
          </div>
          <div>
            <p className="text-sm text-gray-500">Volume</p>
            <p className="font-medium">{formatNumber(trackingData?.volume || 0)} L</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Product</p>
            <p className="font-medium">{trackingData?.purchaseOrder?.productType}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Dispatched</p>
            <p className="text-sm">{trackingData?.dispatchedAt ? formatDateTime(trackingData.dispatchedAt) : 'N/A'}</p>
          </div>
          {trackingData?.deliveredAt && (
            <div>
              <p className="text-sm text-gray-500">Delivered</p>
              <p className="text-sm">{formatDateTime(trackingData.deliveredAt)}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DeliveryTracking;