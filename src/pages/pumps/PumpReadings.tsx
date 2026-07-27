import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { pumpsApi } from '../../api/pumps';
import { ArrowLeft, RefreshCw, Download, Calendar } from 'lucide-react';
import { formatNumber, formatCurrency, formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const PumpReadings: React.FC = () => {
  const { pumpId } = useParams<{ pumpId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [readings, setReadings] = useState<any[]>([]);
  const [pump, setPump] = useState<any>(null);
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  useEffect(() => { if (pumpId) fetchReadings(); }, [pumpId, dateRange]);

  const fetchReadings = async () => {
    try {
      setLoading(true);
      const [pumpData, readingsData] = await Promise.all([
        pumpsApi.getById(pumpId!),
        pumpsApi.getReadings(pumpId!, dateRange.start, dateRange.end),
      ]);
      setPump(pumpData);
      setReadings(readingsData);
    } catch (error) { toast.error('Failed to load readings'); }
    finally { setLoading(false); }
  };

  if (loading) return <Loader fullScreen text="Loading pump readings..." />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/pumps')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">Pump #{pump?.pumpNumber} Readings</h1>
          <p className="text-gray-500">{pump?.productType} • {pump?.isActive ? 'Active' : 'Inactive'}</p></div>
        </div>
        <button onClick={fetchReadings} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><RefreshCw size={16} /> Refresh</button>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex flex-wrap gap-4 items-end">
          <div><label className="block text-sm font-medium text-gray-700">Start Date</label><input type="date" value={dateRange.start} onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg" /></div>
          <div><label className="block text-sm font-medium text-gray-700">End Date</label><input type="date" value={dateRange.end} onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })} className="px-3 py-2 border border-gray-200 rounded-lg" /></div>
          <button onClick={fetchReadings} className="px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90">Apply</button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><Download size={16} /> Export</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead><tr className="bg-gray-50 border-b">
              <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Date</th>
              <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Attendant</th>
              <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Opening</th>
              <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Closing</th>
              <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Litres</th>
              <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Expected</th>
            </tr></thead>
            <tbody>
              {readings.length === 0 ? <tr><td colSpan={6} className="text-center py-8 text-gray-500">No readings found</td></tr> :
                readings.map((r) => <tr key={r.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{formatDateTime(r.readingDate)}</td>
                  <td className="py-3 px-4 text-sm">{r.attendant?.firstName}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatNumber(r.openingMeter)}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatNumber(r.closingMeter)}</td>
                  <td className="py-3 px-4 text-sm text-right font-medium">{formatNumber(r.litresSold)}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatCurrency(r.expectedRevenue)}</td>
                </tr>)
              }
            </tbody>
            <tfoot className="bg-gray-50 font-bold">
              <tr><td colSpan={4} className="py-3 px-4 text-right">Totals</td>
                <td className="py-3 px-4 text-right">{formatNumber(readings.reduce((sum, r) => sum + r.litresSold, 0))}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(readings.reduce((sum, r) => sum + r.expectedRevenue, 0))}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PumpReadings;