import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useStation } from '../../contexts/StationContext';
import { expensesApi } from '../../api/expenses';
import { stationsApi } from '../../api/stations';
import { RefreshCw, CheckCircle, XCircle, Clock, Eye, Building, Layers } from 'lucide-react';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const ExpenseApprovals: React.FC = () => {
  const { user } = useAuth();
  const { selectedStationId, isSuperAdmin, isAllStations } = useStation();
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  useEffect(() => { 
    fetchPendingApprovals(); 
  }, [selectedStationId]);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      
      let approvalsData: any[] = [];

      if (isAllStations && isSuperAdmin) {
        // Fetch approvals from all stations
        const allStations = await stationsApi.getAll();
        const approvalPromises = allStations.map(station => 
          expensesApi.getPendingApprovals(station.id)
        );
        const allApprovals = await Promise.all(approvalPromises);
        approvalsData = allApprovals.flat();
      } else if (selectedStationId) {
        // Fetch approvals for specific station
        approvalsData = await expensesApi.getPendingApprovals(selectedStationId);
      } else {
        approvalsData = [];
      }
      
      setExpenses(approvalsData);
    } catch (error) {
      console.error('Error fetching approvals:', error);
      toast.error('Failed to load approvals');
    } finally { 
      setLoading(false); 
    }
  };

  const handleApprove = async (id: string) => {
    try { 
      await expensesApi.approve(id); 
      toast.success('Expense approved'); 
      fetchPendingApprovals(); 
    } catch (error) { 
      toast.error('Failed to approve'); 
    }
  };

  const getStationDisplay = () => {
    if (isAllStations && isSuperAdmin) return 'All Stations';
    return 'Selected Station';
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Approvals</h1>
          <p className="text-gray-500">Review and approve pending expenses</p>
          <div className="mt-1 text-sm text-petroleum-seagreen flex items-center gap-2">
            {isAllStations && isSuperAdmin ? (
              <Layers size={16} />
            ) : (
              <Building size={16} />
            )}
            <span>{getStationDisplay()}</span>
          </div>
        </div>
        <button onClick={fetchPendingApprovals} className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Date</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Description</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Category</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Amount</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Created By</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {expenses.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-8 text-gray-500">No pending approvals</td></tr>
              ) : (
                expenses.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{formatDateTime(e.createdAt)}</td>
                    <td className="py-3 px-4 text-sm font-medium">{e.description}</td>
                    <td className="py-3 px-4 text-sm">{e.category.replace('_', ' ')}</td>
                    <td className="py-3 px-4 text-sm text-right font-bold">{formatCurrency(e.amount)}</td>
                    <td className="py-3 px-4 text-sm">{e.createdBy?.firstName}</td>
                    <td className="py-3 px-4">
                      <div className="flex gap-2">
                        <button onClick={() => { setSelectedExpense(e); setShowDetailsModal(true); }} className="p-1 text-gray-500 hover:text-petroleum-seagreen">
                          <Eye size={18} />
                        </button>
                        <button onClick={() => handleApprove(e.id)} className="p-1 text-green-500 hover:text-green-700">
                          <CheckCircle size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showDetailsModal} onClose={() => setShowDetailsModal(false)} title="Expense Details" size="md">
        {selectedExpense && <div className="space-y-4">
          <div><p className="text-sm text-gray-500">Description</p><p className="font-medium">{selectedExpense.description}</p></div>
          <div className="grid grid-cols-2 gap-4">
            <div><p className="text-sm text-gray-500">Category</p><p>{selectedExpense.category.replace('_', ' ')}</p></div>
            <div><p className="text-sm text-gray-500">Amount</p><p className="text-xl font-bold text-petroleum-seagreen">{formatCurrency(selectedExpense.amount)}</p></div>
          </div>
          <div><p className="text-sm text-gray-500">Voucher Number</p><p className="font-mono">{selectedExpense.voucherNumber}</p></div>
          <div><p className="text-sm text-gray-500">Created By</p><p>{selectedExpense.createdBy?.firstName} {selectedExpense.createdBy?.lastName}</p></div>
          <div><p className="text-sm text-gray-500">Created At</p><p>{formatDateTime(selectedExpense.createdAt)}</p></div>
          {selectedExpense.receiptUrl && <div><p className="text-sm text-gray-500">Receipt</p><a href={selectedExpense.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-petroleum-seagreen hover:underline">View Receipt</a></div>}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button onClick={() => setShowDetailsModal(false)} className="px-4 py-2 text-gray-600 hover:text-gray-900">Close</button>
            <button onClick={() => { handleApprove(selectedExpense.id); setShowDetailsModal(false); }} className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">Approve</button>
          </div>
        </div>}
      </Modal>
    </div>
  );
};

export default ExpenseApprovals;