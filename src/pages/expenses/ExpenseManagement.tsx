import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { expensesApi } from '../../api/expenses';
import {
  Plus, Search, Filter, Download, RefreshCw,
  Eye, Edit, Trash2, CheckCircle, XCircle, Clock,
  Fuel, Wrench, Users, Lightbulb, FileText, Settings,
  Calendar, Building, Layers, X
} from 'lucide-react';
import { Expense, ExpenseCategory } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';
import { useStation } from '../../contexts/StationContext';
import { stationsApi } from '../../api/stations';
import { PieChart } from 'lucide-react';
import { PieChart as RechartsPieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];

const ExpenseManagement: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { 
    selectedStationId, 
    isSuperAdmin, 
    isAllStations, 
    stations, 
    loading: stationLoading 
  } = useStation();

  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // Date range state
  const [dateRange, setDateRange] = useState({
    start: '',
    end: '',
  });

  // Fetch expenses when station, category, or date range changes
  useEffect(() => {
    if (!stationLoading) {
      fetchExpenses();
    }
  }, [selectedStationId, categoryFilter, stationLoading, isAllStations, dateRange]);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      
      let expensesData: Expense[] = [];

      // Prepare date filters
      const params: any = {
        category: categoryFilter as ExpenseCategory || undefined,
      };
      
      if (dateRange.start) {
        params.startDate = new Date(dateRange.start).toISOString();
      }
      if (dateRange.end) {
        params.endDate = new Date(dateRange.end).toISOString();
      }

      // Case 1: Super Admin with "All Stations" selected
      if (isAllStations && isSuperAdmin) {
        console.log('Fetching expenses from ALL stations');
        const allStations = await stationsApi.getAll();
        const expensePromises = allStations.map(station => 
          expensesApi.getStationExpenses(station.id, params).catch(err => {
            console.error(`Error fetching expenses for station ${station.id}:`, err);
            return [];
          })
        );
        const allExpenses = await Promise.all(expensePromises);
        expensesData = allExpenses.flat();
      } 
      // Case 2: Specific station selected (including Super Admin with specific station)
      else if (selectedStationId) {
        console.log(`Fetching expenses for station: ${selectedStationId}`);
        expensesData = await expensesApi.getStationExpenses(selectedStationId, params);
      } 
      // Case 3: No station selected
      else {
        console.log('No station selected');
        expensesData = [];
      }
      
      console.log(`Found ${expensesData.length} expenses`);
      setExpenses(expensesData);
      setTotalPages(Math.ceil(expensesData.length / 10));
    } catch (error) {
      console.error('Error fetching expenses:', error);
      toast.error('Failed to load expenses');
      setExpenses([]);
    } finally {
      setLoading(false);
    }
  };

  const getStationDisplay = () => {
    if (isAllStations && isSuperAdmin) return 'All Stations';
    const station = stations.find(s => s.id === selectedStationId);
    return station ? station.name : 'No Station';
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const pendingExpenses = expenses.filter(e => !e.approvedById).reduce((sum, e) => sum + e.amount, 0);
  const approvedExpenses = expenses.filter(e => e.approvedById).reduce((sum, e) => sum + e.amount, 0);
  const pendingCount = expenses.filter(e => !e.approvedById).length;

  // Category breakdown for pie chart
  const categoryBreakdown = expenses.reduce((acc: any, expense) => {
    const cat = expense.category;
    if (!acc[cat]) acc[cat] = 0;
    acc[cat] += expense.amount;
    return acc;
  }, {});

  const pieData = Object.entries(categoryBreakdown).map(([name, value]) => ({
    name: name.replace(/_/g, ' '),
    value,
  }));

  // Pending approvals list
  const pendingApprovals = expenses.filter(e => !e.approvedById).slice(0, 10);

  const handleDelete = async () => {
    if (!selectedExpense) return;
    try {
      await expensesApi.delete(selectedExpense.id);
      toast.success('Expense deleted successfully');
      setShowDeleteModal(false);
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to delete expense');
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await expensesApi.approve(id);
      toast.success('Expense approved successfully');
      fetchExpenses();
    } catch (error) {
      toast.error('Failed to approve expense');
    }
  };

  // Quick date filter handlers
  const setDateRangeFilter = (start: Date, end: Date) => {
    setDateRange({
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    });
  };

  const clearDateFilter = () => {
    setDateRange({ start: '', end: '' });
  };

  const filteredExpenses = expenses.filter(expense =>
    expense.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.voucherNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    expense.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedExpenses = filteredExpenses.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'FUEL_FOR_GENS': return <Fuel size={16} />;
      case 'MAINTENANCE': return <Wrench size={16} />;
      case 'SALARIES': return <Users size={16} />;
      case 'UTILITIES': return <Lightbulb size={16} />;
      case 'ADMINISTRATIVE': return <FileText size={16} />;
      default: return <Settings size={16} />;
    }
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      FUEL_FOR_GENS: 'bg-yellow-100 text-yellow-700',
      MAINTENANCE: 'bg-blue-100 text-blue-700',
      SALARIES: 'bg-purple-100 text-purple-700',
      UTILITIES: 'bg-green-100 text-green-700',
      ADMINISTRATIVE: 'bg-gray-100 text-gray-700',
      OPERATIONAL: 'bg-orange-100 text-orange-700',
    };
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getStatusBadge = (expense: Expense) => {
    if (expense.approvedById) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
          <CheckCircle size={12} />
          Approved
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
        <Clock size={12} />
        Pending
      </span>
    );
  };

  // Show loading while stations are loading
  if (stationLoading || loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Expense Management</h1>
          <p className="text-gray-500">Track, manage, and approve station operational costs</p>
          <div className="mt-1 text-sm text-petroleum-seagreen flex items-center gap-2">
            {isAllStations && isSuperAdmin ? (
              <Layers size={16} />
            ) : (
              <Building size={16} />
            )}
            <span>{getStationDisplay()}</span>
            {selectedStationId && (
              <span className="text-xs text-gray-400 ml-2">
                ({expenses.length} expenses)
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/expenses/create')}
            className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
          >
            <Plus size={18} />
            Add Expense
          </button>
          <button
            onClick={fetchExpenses}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </div>

        {/* Filters */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <SearchBar
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by description, voucher number, or category..."
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value="">All Categories</option>
              <option value="FUEL_FOR_GENS">Fuel for Gens</option>
              <option value="MAINTENANCE">Maintenance</option>
              <option value="SALARIES">Salaries</option>
              <option value="UTILITIES">Utilities</option>
              <option value="ADMINISTRATIVE">Administrative</option>
              <option value="OPERATIONAL">Operational</option>
            </select>
            
            {/* Date Filter Toggle Button */}
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className={`px-4 py-2 border rounded-lg text-sm transition-colors flex items-center gap-2 ${
                showDateFilter || (dateRange.start || dateRange.end)
                  ? 'bg-petroleum-seagreen/10 border-petroleum-seagreen text-petroleum-seagreen'
                  : 'border-gray-200 hover:bg-gray-50 text-gray-600'
              }`}
            >
              <Calendar size={16} />
              {dateRange.start || dateRange.end ? 'Date Filter Active' : 'Date Range'}
              {(dateRange.start || dateRange.end) && (
                <span className="ml-1 px-1.5 py-0.5 bg-petroleum-seagreen text-white rounded-full text-xs">
                  Active
                </span>
              )}
            </button>
            
            <button
              onClick={fetchExpenses}
              className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {/* Date Range Filter Panel */}
        {showDateFilter && (
          <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">From:</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-700">To:</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                  />
                </div>
                
                {/* Quick Date Filters */}
                <div className="flex flex-wrap items-center gap-2 ml-2">
                  <span className="text-xs text-gray-400">Quick:</span>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      setDateRangeFilter(start, end);
                    }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - 7);
                      setDateRangeFilter(start, end);
                    }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Last 7 Days
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setDate(start.getDate() - 30);
                      setDateRangeFilter(start, end);
                    }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Last 30 Days
                  </button>
                  <button
                    onClick={() => {
                      const end = new Date();
                      const start = new Date();
                      start.setMonth(start.getMonth() - 3);
                      setDateRangeFilter(start, end);
                    }}
                    className="px-3 py-1.5 text-xs border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Last 3 Months
                  </button>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {(dateRange.start || dateRange.end) && (
                  <button
                    onClick={clearDateFilter}
                    className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X size={14} />
                    Clear
                  </button>
                )}
                <button
                  onClick={() => {
                    setShowDateFilter(false);
                    fetchExpenses();
                  }}
                  className="px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors text-sm font-medium"
                >
                  Apply Filter
                </button>
              </div>
            </div>
            
            {/* Active filter display */}
            {(dateRange.start || dateRange.end) && (
              <div className="mt-3 pt-3 border-t border-gray-100 flex items-center gap-2">
                <span className="text-xs text-gray-500">Active filters:</span>
                {dateRange.start && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    From: {new Date(dateRange.start).toLocaleDateString()}
                  </span>
                )}
                {dateRange.end && (
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded-full">
                    To: {new Date(dateRange.end).toLocaleDateString()}
                  </span>
                )}
                <span className="text-xs text-gray-400 ml-2">
                  {expenses.length} expenses found
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Expenses</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
          <p className="text-xs text-gray-500">{expenses.length} entries</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Pending Approval</p>
          <p className="text-2xl font-bold text-yellow-600">{formatCurrency(pendingExpenses)}</p>
          <p className="text-xs text-gray-500">{pendingCount} pending</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Approved</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(approvedExpenses)}</p>
          <p className="text-xs text-gray-500">{expenses.filter(e => e.approvedById).length} approved</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Avg Expense</p>
          <p className="text-2xl font-bold text-purple-600">
            {expenses.length > 0 ? formatCurrency(totalExpenses / expenses.length) : formatCurrency(0)}
          </p>
          <p className="text-xs text-gray-500">Per transaction</p>
        </div>
      </div>

      {/* Two Column Layout: Pie Chart + Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Pie Chart */}
        <div className="lg:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <PieChart size={20} className="text-petroleum-seagreen" />
                Category Breakdown
              </h3>
            </div>
            {pieData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value as number)} />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No expense data available</p>
              </div>
            )}
            <div className="mt-4 text-center text-sm text-gray-500">
              Total: {formatCurrency(totalExpenses)}
            </div>
          </div>
        </div>

        {/* Right Column - Pending Approvals */}
        <div className="lg:col-span-2">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 h-full">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Clock size={20} className="text-yellow-600" />
                Pending Approvals
                {pendingCount > 0 && (
                  <span className="ml-2 px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">
                    {pendingCount}
                  </span>
                )}
              </h3>
              {pendingCount > 10 && (
                <button className="text-sm text-petroleum-seagreen hover:underline">
                  View All ({pendingCount})
                </button>
              )}
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-500">
                <CheckCircle size={48} className="text-green-500 mb-2" />
                <p>All expenses are approved!</p>
                <p className="text-sm">No pending approvals at this time.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-72 overflow-y-auto pr-2">
                {pendingApprovals.map((expense) => (
                  <div
                    key={expense.id}
                    className="flex items-center justify-between p-3 bg-yellow-50 border border-yellow-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                          {expense.category.replace('_', ' ')}
                        </span>
                        <span className="text-sm font-medium text-gray-900 truncate">
                          {expense.description}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span>Voucher: {expense.voucherNumber}</span>
                        <span>•</span>
                        <span>By: {expense.createdBy?.firstName} {expense.createdBy?.lastName}</span>
                        <span>•</span>
                        <span>{formatDate(expense.createdAt)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 ml-4">
                      <span className="text-lg font-bold text-gray-900">
                        {formatCurrency(expense.amount)}
                      </span>
                      <button
                        onClick={() => handleApprove(expense.id)}
                        className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors flex items-center gap-1"
                      >
                        <CheckCircle size={14} />
                        Approve
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

    

      {/* Expenses Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Date</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Description</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Category</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Voucher</th>
                <th className="text-right text-sm font-medium text-gray-500 py-3 px-4">Amount</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Status</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedExpenses.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <FileText size={32} className="text-gray-300" />
                      <p>No expenses found</p>
                      <p className="text-sm">
                        {dateRange.start || dateRange.end 
                          ? 'Try adjusting your date filters' 
                          : 'Try adjusting your search or filters'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedExpenses.map((expense) => (
                  <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{formatDate(expense.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-sm">{expense.description}</p>
                        <p className="text-xs text-gray-500">by {expense.createdBy?.firstName || 'Unknown'}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(expense.category)}`}>
                        {getCategoryIcon(expense.category)}
                        {expense.category.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm font-mono">{expense.voucherNumber}</td>
                    <td className="py-3 px-4 text-right font-bold text-gray-900">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="py-3 px-4">{getStatusBadge(expense)}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        {!expense.approvedById && (
                          <button
                            onClick={() => handleApprove(expense.id)}
                            className="p-1 text-green-500 hover:text-green-700 transition-colors"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button
                          className="p-1 text-gray-500 hover:text-blue-600 transition-colors"
                          title="Edit"
                          onClick={() => navigate(`/expenses/edit/${expense.id}`)}
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedExpense(expense);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-gray-500 hover:text-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
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

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete Expense"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this expense?
            <br />
            <span className="font-medium">{selectedExpense?.description}</span>
            <br />
            Amount: {formatCurrency(selectedExpense?.amount || 0)}
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowDeleteModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              Delete
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ExpenseManagement;