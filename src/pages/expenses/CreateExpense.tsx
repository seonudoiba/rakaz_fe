import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useStation } from '../../contexts/StationContext';
import { expensesApi } from '../../api/expenses';
import { ExpenseCategory } from '../../types';
import { ArrowLeft, Save, X, Upload, CheckCircle } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import toast from 'react-hot-toast';

const CreateExpense: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedStationId, isSuperAdmin, stations, hasStation } = useStation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    category: 'FUEL_FOR_GENS' as ExpenseCategory,
    description: '',
    amount: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (!formData.amount) newErrors.amount = 'Amount is required';
    else if (parseFloat(formData.amount) <= 0) newErrors.amount = 'Amount must be greater than 0';
    if (!hasStation) newErrors.station = 'No station selected';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      
      const stationId = selectedStationId || user?.stationId;
      
      if (!stationId) {
        toast.error('No station selected. Please select a station first.');
        setLoading(false);
        return;
      }

      // Build the data object
      const data: any = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        stationId: stationId,
        createdById: user?.id,
      };

      // Only add receiptUrl if we have a file
      if (receiptPreview) {
        // For now, store the base64 string
        // In production, you should upload to a file server and store the URL
        data.receiptUrl = receiptPreview;
      }

      console.log('Sending expense data:', {
        ...data,
        receiptUrl: data.receiptUrl ? 'base64_data_present' : 'none'
      });
      
      const response = await expensesApi.create(data);
      console.log('Expense created:', response);
      
      toast.success('Expense recorded successfully');
      navigate('/expenses');
    } catch (error: any) {
      console.error('Error creating expense:', error);
      
      if (error.response?.data?.errors) {
        const errorMessages = error.response.data.errors.map((e: any) => e.message).join(', ');
        toast.error(`Validation failed: ${errorMessages}`);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to create expense. Please check all fields.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload an image or PDF file');
        return;
      }
      
      setReceiptFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setReceiptPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
      toast.success('Receipt uploaded successfully');
    }
  };

  const removeReceipt = () => {
    setReceiptFile(null);
    setReceiptPreview(null);
  };

  if (!hasStation && !loading) {
    return (
      <div className="max-w-md mx-auto mt-20 p-6 bg-white rounded-xl shadow-sm border border-gray-200">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Select a Station</h2>
        <p className="text-gray-600 mb-4">Please select a station to record an expense.</p>
        {isSuperAdmin ? (
          <select
            value={selectedStationId}
            onChange={(e) => {
              // This will be handled by the station context
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          >
            <option value="">Select Station</option>
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.name} ({station.code})
              </option>
            ))}
          </select>
        ) : (
          <p className="text-red-500">No station assigned to your account.</p>
        )}
        <button
          onClick={() => navigate('/expenses')}
          className="mt-4 w-full px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/expenses')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Record Expense</h1>
            <p className="text-gray-500">Log a new station operational expense</p>
            {isSuperAdmin && (
              <p className="text-sm text-petroleum-seagreen mt-1">
                Station: {stations.find(s => s.id === selectedStationId)?.name || 'Not selected'}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => navigate('/expenses')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X size={16} />
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expense Category *
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as ExpenseCategory })}
              className={`w-full px-3 py-2 border ${errors.category ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
            >
              <option value="FUEL_FOR_GENS">Fuel for Generators</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="SALARIES">Salaries</option>
              <option value="UTILITIES">Utilities</option>
              <option value="ADMINISTRATIVE">Administrative</option>
              <option value="OPERATIONAL">Operational</option>
            </select>
            {errors.category && <p className="mt-1 text-sm text-red-500">{errors.category}</p>}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-3 py-2 border ${errors.description ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              placeholder="Describe the expense in detail..."
            />
            {errors.description && <p className="mt-1 text-sm text-red-500">{errors.description}</p>}
          </div>

          {/* Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₦) *
            </label>
            <input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.amount ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              placeholder="0.00"
            />
            {errors.amount && <p className="mt-1 text-sm text-red-500">{errors.amount}</p>}
          </div>

          {/* Receipt Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Receipt (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-petroleum-seagreen transition-colors">
              <input
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                id="receipt-upload"
                onChange={handleFileUpload}
              />
              <label htmlFor="receipt-upload" className="cursor-pointer block">
                <Upload className="mx-auto text-gray-400 mb-2" size={32} />
                <p className="text-sm text-gray-600">Click to upload receipt image or PDF</p>
                <p className="text-xs text-gray-400">PNG, JPG, PDF up to 5MB</p>
              </label>
            </div>
            {receiptPreview && (
              <div className="mt-2 flex items-center gap-3 bg-green-50 p-3 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-800">Receipt uploaded</p>
                  <p className="text-xs text-green-600">{receiptFile?.name}</p>
                </div>
                <button
                  type="button"
                  onClick={removeReceipt}
                  className="text-red-500 hover:text-red-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>
            )}
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/expenses')}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50"
            >
              <Save size={18} />
              {loading ? 'Recording...' : 'Record Expense'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateExpense;