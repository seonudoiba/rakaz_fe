import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { inventoryApi } from '../../api/inventory';
import {
  RefreshCw, Search, Filter, Download,
  CheckCircle, AlertCircle, Calendar,
  FileText, Printer
} from 'lucide-react';
import { formatCurrency, formatNumber, formatDate } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SearchBar from '../../components/common/SearchBar';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const InventoryAudit: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [auditData, setAuditData] = useState<any>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditForm, setAuditForm] = useState({
    productType: '',
    expectedLevel: '',
    actualLevel: '',
    notes: '',
  });

  useEffect(() => {
    fetchAuditData();
  }, []);

  const fetchAuditData = async () => {
    try {
      setLoading(true);
      const stationId = user?.stationId;
      if (!stationId) {
        toast.error('No station assigned');
        return;
      }
      const [audit, logsData] = await Promise.all([
        inventoryApi.getInventoryAudit(stationId),
        inventoryApi.getInventoryLogs(stationId),
      ]);
      setAuditData(audit);
      setLogs(logsData);
    } catch (error) {
      console.error('Error fetching audit data:', error);
      toast.error('Failed to load audit data');
    } finally {
      setLoading(false);
    }
  };

  const handlePerformAudit = async () => {
    try {
      const stationId = user?.stationId;
      if (!stationId) return;
      await inventoryApi.performAudit(stationId, auditForm);
      toast.success('Inventory audit completed successfully');
      setShowAuditModal(false);
      fetchAuditData();
    } catch (error) {
      toast.error('Failed to perform audit');
    }
  };

  const filteredLogs = logs.filter(log =>
    log.productType.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Inventory Audit</h1>
          <p className="text-gray-500">Last audited {auditData?.lastAudit ? formatDate(auditData.lastAudit) : 'Never'}</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowAuditModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
          >
            <CheckCircle size={18} />
            Perform Audit
          </button>
          <button
            onClick={fetchAuditData}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Audit Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Items Audited</p>
          <p className="text-2xl font-bold text-gray-900">{auditData?.totalItems || 0}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Variances Found</p>
          <p className={`text-2xl font-bold ${(auditData?.variances || 0) > 0 ? 'text-yellow-600' : 'text-green-600'}`}>
            {auditData?.variances || 0}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Value</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(auditData?.totalValue || 0)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Accuracy Rate</p>
          <p className="text-2xl font-bold text-green-600">{auditData?.accuracyRate || 0}%</p>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Audit History</h3>
          <button className="flex items-center gap-2 text-sm text-petroleum-seagreen hover:underline">
            <Printer size={16} />
            Print Report
          </button>
        </div>

        <SearchBar
          value={searchTerm}
          onChange={setSearchTerm}
          placeholder="Search audit logs..."
          className="mb-4"
        />

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Date</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Product</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Previous</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">New</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Adjustment</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Reason</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">User</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.slice(0, 20).map((log) => (
                <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4 text-sm">{formatDate(log.createdAt)}</td>
                  <td className="py-3 px-4 text-sm font-medium">{log.productType}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatNumber(log.previousLevel)}</td>
                  <td className="py-3 px-4 text-sm text-right">{formatNumber(log.newLevel)}</td>
                  <td className={`py-3 px-4 text-sm text-right font-medium ${
                    log.adjustment > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {log.adjustment > 0 ? '+' : ''}{formatNumber(log.adjustment)}
                  </td>
                  <td className="py-3 px-4 text-sm">{log.reason}</td>
                  <td className="py-3 px-4 text-sm">{log.user?.firstName}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Modal */}
      <Modal
        isOpen={showAuditModal}
        onClose={() => setShowAuditModal(false)}
        title="Perform Inventory Audit"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handlePerformAudit(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product Type *
            </label>
            <select
              value={auditForm.productType}
              onChange={(e) => setAuditForm({ ...auditForm, productType: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              required
            >
              <option value="">Select Product</option>
              <option value="PMS">PMS (Premium)</option>
              <option value="AGO">AGO (Diesel)</option>
              <option value="DPK">DPK (Kerosene)</option>
              <option value="LPG">LPG (Gas)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Expected Level (L)
            </label>
            <input
              type="number"
              step="0.01"
              value={auditForm.expectedLevel}
              onChange={(e) => setAuditForm({ ...auditForm, expectedLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Actual Level (L)
            </label>
            <input
              type="number"
              step="0.01"
              value={auditForm.actualLevel}
              onChange={(e) => setAuditForm({ ...auditForm, actualLevel: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              value={auditForm.notes}
              onChange={(e) => setAuditForm({ ...auditForm, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              placeholder="Any observations or comments..."
            />
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowAuditModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              Perform Audit
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default InventoryAudit;