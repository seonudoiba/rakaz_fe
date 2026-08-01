import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usersApi } from '../../api/users';
import { stationsApi } from '../../api/stations';
import { regionsApi } from '../../api/regions';
import {
  Plus, Search, RefreshCw,
  Edit, Trash2, User, Mail,
  Phone, Shield, CheckCircle,
  XCircle, Users, Building,
  Layers, Key, Save, AlertTriangle
} from 'lucide-react';
import { User as UserType, UserRole } from '../../types';
import { formatDate, formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

type TabType = 'all' | UserRole;

const UserManagement: React.FC = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [stations, setStations] = useState<any[]>([]);
  const [regions, setRegions] = useState<any[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: UserRole.ATTENDANT,
    stationId: '',
    regionId: '',
    isActive: true,
  });

  const [editFormData, setEditFormData] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    role: UserRole.ATTENDANT,
    stationId: '',
    regionId: '',
    isActive: true,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // Role tab configuration
  const tabs: { id: TabType; label: string; icon: React.ReactNode; color: string }[] = [
    { id: 'all', label: 'All Users', icon: <Users size={16} />, color: 'gray' },
    { id: UserRole.SUPER_ADMIN, label: 'Super Admins', icon: <Shield size={16} />, color: 'purple' },
    { id: UserRole.REGIONAL_MANAGER, label: 'Regional Managers', icon: <Layers size={16} />, color: 'blue' },
    { id: UserRole.SUPERVISOR, label: 'Supervisors', icon: <User size={16} />, color: 'green' },
    { id: UserRole.ATTENDANT, label: 'Attendants', icon: <Users size={16} />, color: 'yellow' },
    { id: UserRole.ACCOUNTANT, label: 'Accountants', icon: <Mail size={16} />, color: 'red' },
  ];

  useEffect(() => {
    fetchData();
  }, [activeTab, currentPage]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const [stationsData, regionsData] = await Promise.all([
        stationsApi.getAll(),
        regionsApi.getAll(),
      ]);
      setStations(stationsData);
      setRegions(regionsData);

      let filters: { role?: string } = {};
      if (activeTab !== 'all') {
        filters.role = activeTab;
      }
      const usersData = await usersApi.getAll(filters);
      setUsers(usersData);
      setTotalPages(Math.ceil(usersData.length / 10));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;
    try {
      await usersApi.delete(selectedUser.id);
      toast.success('User deleted successfully');
      setShowDeleteModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.email) newErrors.email = 'Email is required';
    if (!formData.password) newErrors.password = 'Password is required';
    if (formData.password && formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!formData.firstName) newErrors.firstName = 'First name is required';
    if (!formData.lastName) newErrors.lastName = 'Last name is required';
    if (!formData.phone) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateEditForm = () => {
    const newErrors: Record<string, string> = {};
    if (!editFormData.firstName) newErrors.firstName = 'First name is required';
    if (!editFormData.lastName) newErrors.lastName = 'Last name is required';
    if (!editFormData.phone) newErrors.phone = 'Phone is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswordForm = () => {
    const newErrors: Record<string, string> = {};
    if (!passwordData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    if (!passwordData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (passwordData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateForm()) return;
    try {
      setSubmitting(true);
      await usersApi.create(formData);
      toast.success('User created successfully');
      setShowCreateModal(false);
      resetForm();
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateUser = async () => {
    if (!selectedUser || !validateEditForm()) return;
    try {
      setSubmitting(true);
      await usersApi.update(selectedUser.id, editFormData);
      toast.success('User updated successfully');
      setShowEditModal(false);
      fetchData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !validatePasswordForm()) return;
    try {
      setSubmitting(true);
      await usersApi.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      toast.success('Password changed successfully');
      setShowPasswordModal(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      email: '',
      password: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: UserRole.ATTENDANT,
      stationId: '',
      regionId: '',
      isActive: true,
    });
    setErrors({});
  };

  const openEditModal = (user: UserType) => {
    setSelectedUser(user);
    setEditFormData({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role,
      stationId: user.stationId || '',
      regionId: user.regionId || '',
      isActive: user.isActive,
    });
    setShowEditModal(true);
  };

  const openPasswordModal = (user: UserType) => {
    setSelectedUser(user);
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordModal(true);
  };

  const getRoleBadge = (role: UserRole) => {
    const colors: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'bg-purple-100 text-purple-700',
      [UserRole.REGIONAL_MANAGER]: 'bg-blue-100 text-blue-700',
      [UserRole.SUPERVISOR]: 'bg-green-100 text-green-700',
      [UserRole.ATTENDANT]: 'bg-yellow-100 text-yellow-700',
      [UserRole.ACCOUNTANT]: 'bg-red-100 text-red-700',
    };
    return colors[role] || 'bg-gray-100 text-gray-700';
  };

  const getRoleLabel = (role: UserRole) => {
    const labels: Record<UserRole, string> = {
      [UserRole.SUPER_ADMIN]: 'Super Admin',
      [UserRole.REGIONAL_MANAGER]: 'Regional Manager',
      [UserRole.SUPERVISOR]: 'Supervisor',
      [UserRole.ATTENDANT]: 'Attendant',
      [UserRole.ACCOUNTANT]: 'Accountant',
    };
    return labels[role] || role;
  };

  const filteredUsers = users.filter(user =>
    user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  const getTabCount = (tabId: TabType) => {
    if (tabId === 'all') return users.length;
    return users.filter(u => u.role === tabId).length;
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-500">Manage system users and their permissions</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              resetForm();
              setShowCreateModal(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
          >
            <Plus size={18} />
            Add User
          </button>
          <button
            onClick={fetchData}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-red-600">
            {users.filter(u => !u.isActive).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Super Admins</p>
          <p className="text-2xl font-bold text-purple-600">
            {users.filter(u => u.role === UserRole.SUPER_ADMIN).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Managers</p>
          <p className="text-2xl font-bold text-blue-600">
            {users.filter(u => u.role === UserRole.REGIONAL_MANAGER).length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Supervisors</p>
          <p className="text-2xl font-bold text-green-600">
            {users.filter(u => u.role === UserRole.SUPERVISOR).length}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto pb-0.5" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setCurrentPage(1);
              }}
              className={`
                flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-all whitespace-nowrap
                ${activeTab === tab.id
                  ? 'bg-petroleum-seagreen/10 text-petroleum-seagreen border-b-2 border-petroleum-seagreen'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }
              `}
            >
              {tab.icon}
              {tab.label}
              <span className={`
                ml-1 px-2 py-0.5 rounded-full text-xs
                ${activeTab === tab.id
                  ? 'bg-petroleum-seagreen/20 text-petroleum-seagreen'
                  : 'bg-gray-100 text-gray-500'
                }
              `}>
                {getTabCount(tab.id)}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by name, email, or phone..."
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">User</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Email</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Role</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Status</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Last Login</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <User size={32} className="text-gray-300" />
                      <p>No users found</p>
                      <p className="text-sm">Click "Add User" to create a new user</p>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-petroleum-seagreen/20 flex items-center justify-center text-petroleum-dark font-semibold text-sm">
                          {user.firstName?.[0]}{user.lastName?.[0]}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {user.firstName} {user.lastName}
                          </p>
                          <p className="text-xs text-gray-500">{user.phone}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1">
                        <Mail size={14} className="text-gray-400" />
                        <span className="text-sm">{user.email}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadge(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        user.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {user.isActive ? (
                          <CheckCircle size={12} />
                        ) : (
                          <XCircle size={12} />
                        )}
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-500">
                      {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Never'}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-1.5 text-gray-500 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
                          title="Edit"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => openPasswordModal(user)}
                          className="p-1.5 text-gray-500 hover:text-yellow-600 transition-colors rounded-lg hover:bg-yellow-50"
                          title="Change Password"
                        >
                          <Key size={16} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setShowDeleteModal(true);
                          }}
                          className="p-1.5 text-gray-500 hover:text-red-600 transition-colors rounded-lg hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
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

      {/* CREATE USER MODAL */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => { setShowCreateModal(false); resetForm(); }}
        title="Create New User"
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
            />
            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              minLength={8}
            />
            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
            <p className="mt-1 text-xs text-gray-400">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="text"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
              <option value={UserRole.REGIONAL_MANAGER}>Regional Manager</option>
              <option value={UserRole.SUPERVISOR}>Supervisor</option>
              <option value={UserRole.ATTENDANT}>Attendant</option>
              <option value={UserRole.ACCOUNTANT}>Accountant</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Station
              </label>
              <select
                value={formData.stationId}
                onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              >
                <option value="">No Station</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <select
                value={formData.regionId}
                onChange={(e) => setFormData({ ...formData, regionId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              >
                <option value="">No Region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="isActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="rounded text-petroleum-seagreen focus:ring-petroleum-seagreen"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => { setShowCreateModal(false); resetForm(); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50"
            >
              <Save size={18} />
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* EDIT USER MODAL */}
      <Modal
        isOpen={showEditModal}
        onClose={() => { setShowEditModal(false); setErrors({}); }}
        title={`Edit User: ${selectedUser?.firstName} ${selectedUser?.lastName}`}
        size="lg"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleUpdateUser(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={editFormData.firstName}
                onChange={(e) => setEditFormData({ ...editFormData, firstName: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              />
              {errors.firstName && <p className="mt-1 text-sm text-red-500">{errors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={editFormData.lastName}
                onChange={(e) => setEditFormData({ ...editFormData, lastName: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              />
              {errors.lastName && <p className="mt-1 text-sm text-red-500">{errors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="text"
              value={editFormData.phone}
              onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
            />
            {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={editFormData.role}
              onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value as UserRole })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
              <option value={UserRole.REGIONAL_MANAGER}>Regional Manager</option>
              <option value={UserRole.SUPERVISOR}>Supervisor</option>
              <option value={UserRole.ATTENDANT}>Attendant</option>
              <option value={UserRole.ACCOUNTANT}>Accountant</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Station
              </label>
              <select
                value={editFormData.stationId}
                onChange={(e) => setEditFormData({ ...editFormData, stationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              >
                <option value="">No Station</option>
                {stations.map((s) => (
                  <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <select
                value={editFormData.regionId}
                onChange={(e) => setEditFormData({ ...editFormData, regionId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              >
                <option value="">No Region</option>
                {regions.map((r) => (
                  <option key={r.id} value={r.id}>{r.name} ({r.code})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="editIsActive"
              checked={editFormData.isActive}
              onChange={(e) => setEditFormData({ ...editFormData, isActive: e.target.checked })}
              className="rounded text-petroleum-seagreen focus:ring-petroleum-seagreen"
            />
            <label htmlFor="editIsActive" className="text-sm font-medium text-gray-700">
              Active
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => { setShowEditModal(false); setErrors({}); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50"
            >
              <Save size={18} />
              {submitting ? 'Updating...' : 'Update User'}
            </button>
          </div>
        </form>
      </Modal>

      {/* CHANGE PASSWORD MODAL */}
      <Modal
        isOpen={showPasswordModal}
        onClose={() => { setShowPasswordModal(false); setErrors({}); }}
        title={`Change Password: ${selectedUser?.firstName} ${selectedUser?.lastName}`}
      >
        <form onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Current Password *
            </label>
            <input
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.currentPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
            />
            {errors.currentPassword && <p className="mt-1 text-sm text-red-500">{errors.currentPassword}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              New Password *
            </label>
            <input
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.newPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              minLength={8}
            />
            {errors.newPassword && <p className="mt-1 text-sm text-red-500">{errors.newPassword}</p>}
            <p className="mt-1 text-xs text-gray-400">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password *
            </label>
            <input
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.confirmPassword ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
            />
            {errors.confirmPassword && <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => { setShowPasswordModal(false); setErrors({}); }}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50"
            >
              <Key size={18} />
              {submitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </Modal>

      {/* DELETE CONFIRM MODAL */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Delete User"
      >
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-lg">
            <AlertTriangle size={24} />
            <p className="font-medium">Are you sure you want to delete this user?</p>
          </div>
          {selectedUser && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>
                <strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}
              </p>
              <p>
                <strong>Email:</strong> {selectedUser.email}
              </p>
              <p>
                <strong>Role:</strong> {getRoleLabel(selectedUser.role)}
              </p>
            </div>
          )}
          <p className="text-sm text-red-500">
            ⚠️ This action cannot be undone. All associated data will be permanently removed.
          </p>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
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
              Delete User
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;