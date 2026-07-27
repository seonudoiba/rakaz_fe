import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { stationsApi } from '../../api/stations';
import { usersApi } from '../../api/users';
import { regionsApi } from '../../api/regions';
import { ArrowLeft, Save, X, Plus, Trash2, MapPin, Phone, Mail, Clock } from 'lucide-react';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const StationManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const stationId = searchParams.get('id');
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [regions, setRegions] = useState<any[]>([]);
  const [managers, setManagers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '', code: '', address: '', city: '', state: '', regionId: '',
    managerId: '', phone: '', email: '', openingTime: '08:00', closingTime: '18:00',
    latitude: '', longitude: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { 
    fetchData(); 
    if (stationId) { 
      setIsEdit(true); 
      fetchStation(stationId); 
    } 
  }, [stationId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [regionsData, managersData] = await Promise.all([
        regionsApi.getAll(),
        usersApi.getAll({ role: 'SUPERVISOR' }).catch(err => {
          console.warn('Could not fetch supervisors:', err);
          return []; // Return empty array on error
        }),
      ]);
      setRegions(regionsData);
      setManagers(managersData);
    } catch (error) {
      console.error('Failed to load data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const fetchStation = async (id: string) => {
    try {
      setLoading(true);
      const station = await stationsApi.getOne(id);
      setFormData({
        name: station.name, 
        code: station.code, 
        address: station.address,
        city: station.city, 
        state: station.state, 
        regionId: station.regionId,
        managerId: station.manager?.id || '',
        phone: station.phone || '',
        email: station.email || '', 
        openingTime: station.openingTime || '08:00',
        closingTime: station.closingTime || '18:00',
        latitude: station.latitude?.toString() || '',
        longitude: station.longitude?.toString() || '',
      });
    } catch (error) { 
      console.error('Failed to load station:', error);
      toast.error('Failed to load station'); 
    } finally { 
      setLoading(false); 
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = 'Station name is required';
    if (!formData.code) newErrors.code = 'Station code is required';
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.state) newErrors.state = 'State is required';
    if (!formData.regionId) newErrors.regionId = 'Region is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      setLoading(true);
      const data = { 
        ...formData, 
        latitude: formData.latitude ? parseFloat(formData.latitude) : null, 
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
      };
      if (isEdit) { 
        await stationsApi.update(stationId!, data); 
        toast.success('Station updated successfully'); 
      } else { 
        await stationsApi.create(data); 
        toast.success('Station created successfully'); 
      }
      navigate('/stations');
    } catch (error: any) { 
      console.error('Failed to save station:', error);
      toast.error(error.response?.data?.message || 'Failed to save station'); 
    } finally { 
      setLoading(false); 
    }
  };

  if (loading && isEdit) return <Loader fullScreen />;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/stations')} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft size={20} /></button>
          <div><h1 className="text-2xl font-bold text-gray-900">{isEdit ? 'Edit Station' : 'Add New Station'}</h1>
          <p className="text-gray-500">{isEdit ? 'Update station information' : 'Create a new station location'}</p></div>
        </div>
        <button onClick={() => navigate('/stations')} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"><X size={16} /> Cancel</button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Basic Information */}
          <div><h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Station Name *</label>
                <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className={`w-full px-3 py-2 border ${errors.name ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`} />
                {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Station Code *</label>
                <input type="text" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className={`w-full px-3 py-2 border ${errors.code ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`} placeholder="e.g., ALPHA-01" />
                {errors.code && <p className="mt-1 text-sm text-red-500">{errors.code}</p>}
              </div>
            </div>
          </div>

          {/* Location */}
          <div><h3 className="text-lg font-semibold text-gray-900 mb-4">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2"><label className="block text-sm font-medium text-gray-700 mb-1">Address *</label>
                <input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={`w-full px-3 py-2 border ${errors.address ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`} />
                {errors.address && <p className="mt-1 text-sm text-red-500">{errors.address}</p>}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} className={`w-full px-3 py-2 border ${errors.city ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`} />
                {errors.city && <p className="mt-1 text-sm text-red-500">{errors.city}</p>}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                <input type="text" value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} className={`w-full px-3 py-2 border ${errors.state ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`} />
                {errors.state && <p className="mt-1 text-sm text-red-500">{errors.state}</p>}
              </div>
            </div>
          </div>

          {/* Management */}
          <div><h3 className="text-lg font-semibold text-gray-900 mb-4">Management</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                <select value={formData.regionId} onChange={(e) => setFormData({ ...formData, regionId: e.target.value })} className={`w-full px-3 py-2 border ${errors.regionId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}>
                  <option value="">Select Region</option>{regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
                {errors.regionId && <p className="mt-1 text-sm text-red-500">{errors.regionId}</p>}
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Station Manager</label>
                <select value={formData.managerId} onChange={(e) => setFormData({ ...formData, managerId: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen">
                  <option value="">Select Manager</option>{managers.map((m) => <option key={m.id} value={m.id}>{m.firstName} {m.lastName} ({m.email})</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div><h3 className="text-lg font-semibold text-gray-900 mb-4">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="text" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" placeholder="+234 800 000 0000" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" placeholder="station@example.com" />
              </div>
            </div>
          </div>

          {/* Operating Hours */}
          <div><h3 className="text-lg font-semibold text-gray-900 mb-4">Operating Hours</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Opening Time</label>
                <input type="time" value={formData.openingTime} onChange={(e) => setFormData({ ...formData, openingTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Closing Time</label>
                <input type="time" value={formData.closingTime} onChange={(e) => setFormData({ ...formData, closingTime: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" />
              </div>
            </div>
          </div>

          {/* GPS Coordinates */}
          <div><h3 className="text-lg font-semibold text-gray-900 mb-4">GPS Coordinates (Optional)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input type="text" value={formData.latitude} onChange={(e) => setFormData({ ...formData, latitude: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" placeholder="e.g., 6.5244" />
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input type="text" value={formData.longitude} onChange={(e) => setFormData({ ...formData, longitude: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" placeholder="e.g., 3.3792" />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => navigate('/stations')} className="px-4 py-2 text-gray-600 hover:text-gray-900">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50">
              <Save size={18} /> {loading ? 'Saving...' : isEdit ? 'Update Station' : 'Create Station'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default StationManagement;