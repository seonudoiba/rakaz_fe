import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { pumpsApi } from '../../api/pumps';
import { RefreshCw, Activity, Fuel, TrendingUp, AlertCircle, CheckCircle, Power, PowerOff } from 'lucide-react';
import { formatNumber, formatCurrency } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import { StatCard } from '../../components/cards/StatCard';
import SalesChart from '../../components/charts/SalesChart';
import toast from 'react-hot-toast';

const PumpDashboard: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboard, setDashboard] = useState<any>(null);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const stationId = user?.stationId;
      if (!stationId) { toast.error('No station assigned'); return; }
      const data = await pumpsApi.getPumpDashboard(stationId);
      setDashboard(data);
    } catch (error) { toast.error('Failed to load pump dashboard'); }
    finally { setLoading(false); }
  };

  if (loading) return <Loader fullScreen text="Loading pump dashboard..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900">Pump Dashboard</h1>
        <p className="text-gray-500">Real-time pump performance and monitoring</p></div>
        <button onClick={fetchDashboard} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /> Refresh</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Pumps" value={dashboard?.totalPumps || 0} icon={Activity} color="blue" />
        <StatCard title="Active Pumps" value={dashboard?.activePumps || 0} icon={CheckCircle} color="green" />
        <StatCard title="Inactive Pumps" value={dashboard?.inactivePumps || 0} icon={PowerOff} color="red" />
        <StatCard title="Today's Volume" value={`${formatNumber(dashboard?.todayVolume || 0)} L`} icon={Fuel} color="purple" />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold mb-4">Daily Pump Performance</h3>
        <SalesChart data={dashboard?.dailyReadings || []} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold mb-4">Pump Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dashboard?.pumps?.map((pump: any) => <div key={pump.id} className="p-4 border border-gray-200 rounded-lg">
            <div className="flex justify-between"><span className="font-medium">Pump #{pump.pumpNumber}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${pump.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {pump.isActive ? <Power size={14} className="inline mr-1" /> : <PowerOff size={14} className="inline mr-1" />}
                {pump.isActive ? 'Active' : 'Inactive'}
              </span></div>
            <p className="text-sm text-gray-500">{pump.productType}</p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-gray-500">Today:</span> <span className="font-medium">{formatNumber(pump.todayVolume)} L</span></div>
              <div><span className="text-gray-500">Revenue:</span> <span className="font-medium">{formatCurrency(pump.todayRevenue)}</span></div>
            </div>
          </div>)}
        </div>
      </div>
    </div>
  );
};

export default PumpDashboard;