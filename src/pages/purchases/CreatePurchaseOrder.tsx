import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { purchasesApi } from '../../api/purchases';
import { ArrowLeft, Save, X, Plus, Trash2 } from 'lucide-react';
import { CreatePurchaseOrderData } from '../../types';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const CreatePurchaseOrder: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePurchaseOrderData>({
    supplierName: '',
    supplierEmail: '',
    supplierPhone: '',
    productType: 'PMS',
    volume: 0,
    unitCost: 0,
    expectedDelivery: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.supplierName) newErrors.supplierName = 'Supplier name is required';
    if (formData.volume <= 0) newErrors.volume = 'Volume must be greater than 0';
    if (formData.unitCost <= 0) newErrors.unitCost = 'Unit cost must be greater than 0';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      await purchasesApi.create({
        ...formData,
        stationId: user?.stationId,
        totalCost: formData.volume * formData.unitCost,
      });
      toast.success('Purchase order created successfully');
      navigate('/purchases');
    } catch (error: any) {
      console.error('Error creating purchase order:', error);
      toast.error(error.response?.data?.message || 'Failed to create purchase order');
    } finally {
      setLoading(false);
    }
  };

  const totalCost = formData.volume * formData.unitCost;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/purchases')} className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Create Purchase Order</h1>
            <p className="text-gray-500">Order fuel and products from suppliers</p>
          </div>
        </div>
        <button onClick={() => navigate('/purchases')} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <X size={16} /> Cancel
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Name *</label>
              <input type="text" value={formData.supplierName} onChange={(e) => setFormData({ ...formData, supplierName: e.target.value })} className={`w-full px-3 py-2 border ${errors.supplierName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`} />
              {errors.supplierName && <p className="mt-1 text-sm text-red-500">{errors.supplierName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Email</label>
              <input type="email" value={formData.supplierEmail} onChange={(e) => setFormData({ ...formData, supplierEmail: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Supplier Phone</label>
              <input type="tel" value={formData.supplierPhone} onChange={(e) => setFormData({ ...formData, supplierPhone: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Type *</label>
              <select value={formData.productType} onChange={(e) => setFormData({ ...formData, productType: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen">
                <option value="PMS">PMS (Premium)</option>
                <option value="AGO">AGO (Diesel)</option>
                <option value="DPK">DPK (Kerosene)</option>
                <option value="LPG">LPG (Gas)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Volume (L) *</label>
              <input type="number" step="0.01" value={formData.volume || ''} onChange={(e) => setFormData({ ...formData, volume: parseFloat(e.target.value) || 0 })} className={`w-full px-3 py-2 border ${errors.volume ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`} />
              {errors.volume && <p className="mt-1 text-sm text-red-500">{errors.volume}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Unit Cost (₦) *</label>
              <input type="number" step="0.01" value={formData.unitCost || ''} onChange={(e) => setFormData({ ...formData, unitCost: parseFloat(e.target.value) || 0 })} className={`w-full px-3 py-2 border ${errors.unitCost ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`} />
              {errors.unitCost && <p className="mt-1 text-sm text-red-500">{errors.unitCost}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Expected Delivery</label>
            <input type="datetime-local" value={formData.expectedDelivery} onChange={(e) => setFormData({ ...formData, expectedDelivery: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={3} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen" placeholder="Additional notes or instructions..." />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm"><span className="text-gray-600">Total Cost:</span><span className="font-bold text-gray-900">{formatCurrency(totalCost)}</span></div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button type="button" onClick={() => navigate('/purchases')} className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors">Cancel</button>
            <button type="submit" disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50">
              <Save size={18} /> {loading ? 'Creating...' : 'Create Order'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreatePurchaseOrder;