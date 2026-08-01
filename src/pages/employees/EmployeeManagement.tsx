import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { employeesApi } from '../../api/employees';
import { usersApi } from '../../api/users';
import { authApi } from '../../api/auth';
import { stationsApi } from '../../api/stations';
import { ArrowLeft, Save, X, User, Mail, Phone, MapPin, Building, DollarSign, CreditCard, Plus } from 'lucide-react';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const EmployeeManagement: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const employeeId = searchParams.get('id');
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [users, setUsers] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [showCreateUserModal, setShowCreateUserModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  
  // Employee form data
  const [formData, setFormData] = useState({
    userId: '',
    stationId: '',
    position: '',
    department: '',
    hireDate: '',
    salary: '',
    bankName: '',
    accountNumber: '',
    emergencyContact: '',
    emergencyPhone: '',
  });

  // New user form data
  const [newUserData, setNewUserData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'ATTENDANT',
    stationId: '',
    regionId: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [userErrors, setUserErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchData();
    if (employeeId) {
      setIsEdit(true);
      fetchEmployee(employeeId);
    }
  }, [employeeId]);

  const fetchData = async () => {
    try {
      const [usersData, stationsData] = await Promise.all([
        usersApi.getAll(),
        stationsApi.getAll(),
      ]);
      // Filter users to only show those without employee records (or all for edit)
      // We'll show all users but highlight those already assigned
      setUsers(usersData);
      setStations(stationsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    }
  };

  const fetchEmployee = async (id: string) => {
    try {
      setLoading(true);
      const employee = await employeesApi.getById(id);
      setFormData({
        userId: employee.userId,
        stationId: employee.stationId,
        position: employee.position,
        department: employee.department,
        hireDate: employee.hireDate.split('T')[0],
        salary: employee.salary?.toString() || '',
        bankName: employee.bankName || '',
        accountNumber: employee.accountNumber || '',
        emergencyContact: employee.emergencyContact || '',
        emergencyPhone: employee.emergencyPhone || '',
      });
    } catch (error) {
      console.error('Error fetching employee:', error);
      toast.error('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.userId) newErrors.userId = 'User is required';
    if (!formData.stationId) newErrors.stationId = 'Station is required';
    if (!formData.position) newErrors.position = 'Position is required';
    if (!formData.department) newErrors.department = 'Department is required';
    if (!formData.hireDate) newErrors.hireDate = 'Hire date is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateNewUser = () => {
    const newErrors: Record<string, string> = {};
    if (!newUserData.email) newErrors.email = 'Email is required';
    if (!newUserData.password) newErrors.password = 'Password is required';
    if (newUserData.password && newUserData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    if (!newUserData.firstName) newErrors.firstName = 'First name is required';
    if (!newUserData.lastName) newErrors.lastName = 'Last name is required';
    if (!newUserData.phone) newErrors.phone = 'Phone is required';
    if (!newUserData.role) newErrors.role = 'Role is required';
    if (!newUserData.stationId) newErrors.stationId = 'Station is required';
    setUserErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCreateUser = async () => {
    if (!validateNewUser()) return;

    try {
      setCreatingUser(true);
      // Create the user
      const createdUser = await authApi.register({
        email: newUserData.email,
        password: newUserData.password,
        firstName: newUserData.firstName,
        lastName: newUserData.lastName,
        phone: newUserData.phone,
        role: newUserData.role as any,
        stationId: newUserData.stationId,
        regionId: newUserData.regionId || undefined,
      });

      // Update the users list
      const updatedUsers = await usersApi.getAll();
      setUsers(updatedUsers);

      // Auto-select the newly created user
      setFormData({ ...formData, userId: createdUser.id });

      toast.success(`User ${createdUser.firstName} ${createdUser.lastName} created successfully!`);
      setShowCreateUserModal(false);
      setNewUserData({
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        phone: '',
        role: 'ATTENDANT',
        stationId: '',
        regionId: '',
      });
      setUserErrors({});
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error(error.response?.data?.message || 'Failed to create user');
    } finally {
      setCreatingUser(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    try {
      setLoading(true);
      const data = {
        ...formData,
        salary: formData.salary ? parseFloat(formData.salary) : undefined,
      };

      if (isEdit) {
        await employeesApi.update(employeeId!, data);
        toast.success('Employee updated successfully');
      } else {
        await employeesApi.create(data);
        toast.success('Employee created successfully');
      }
      navigate('/employees');
    } catch (error: any) {
      console.error('Error saving employee:', error);
      toast.error(error.response?.data?.message || 'Failed to save employee');
    } finally {
      setLoading(false);
    }
  };

  // Get available users (not already assigned to an employee)
  const getAvailableUsers = () => {
    // In a real app, you'd have a way to check if a user already has an employee record
    // For now, we'll show all users and the user can select any
    return users;
  };

  // Get user full name
  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user ? `${user.firstName} ${user.lastName} (${user.email})` : 'Select User';
  };

  if (loading && isEdit) return <Loader fullScreen />;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employees')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Edit Employee' : 'Add New Employee'}
            </h1>
            <p className="text-gray-500">
              {isEdit ? 'Update employee information' : 'Register a new staff member'}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/employees')}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <X size={16} />
          Cancel
        </button>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          {/* User Selection with Create Option */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">
                User Account *
              </label>
              <button
                type="button"
                onClick={() => setShowCreateUserModal(true)}
                className="flex items-center gap-1 text-sm text-petroleum-seagreen hover:underline"
              >
                <Plus size={16} />
                Create New User
              </button>
            </div>
            <select
              value={formData.userId}
              onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.userId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
            >
              <option value="">Select User</option>
              {getAvailableUsers().map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.email}) - {u.role}
                </option>
              ))}
            </select>
            {errors.userId && <p className="mt-1 text-sm text-red-500">{errors.userId}</p>}
            <p className="mt-1 text-xs text-gray-400">
              Select an existing user or click "Create New User" to add one
            </p>
          </div>

          {/* Station Assignment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Station *
            </label>
            <select
              value={formData.stationId}
              onChange={(e) => setFormData({ ...formData, stationId: e.target.value })}
              className={`w-full px-3 py-2 border ${errors.stationId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
            >
              <option value="">Select Station</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            {errors.stationId && <p className="mt-1 text-sm text-red-500">{errors.stationId}</p>}
          </div>

          {/* Position & Department */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position *
              </label>
              <input
                type="text"
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.position ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
                placeholder="e.g., Senior Attendant"
              />
              {errors.position && <p className="mt-1 text-sm text-red-500">{errors.position}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Department *
              </label>
              <select
                value={formData.department}
                onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.department ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              >
                <option value="">Select Department</option>
                <option value="Operations">Operations</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Administration">Administration</option>
                <option value="Sales">Sales</option>
                <option value="Logistics">Logistics</option>
              </select>
              {errors.department && <p className="mt-1 text-sm text-red-500">{errors.department}</p>}
            </div>
          </div>

          {/* Hire Date & Salary */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Hire Date *
              </label>
              <input
                type="date"
                value={formData.hireDate}
                onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                className={`w-full px-3 py-2 border ${errors.hireDate ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              />
              {errors.hireDate && <p className="mt-1 text-sm text-red-500">{errors.hireDate}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Salary (₦)
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.salary}
                onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Bank Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Bank Name
              </label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                placeholder="e.g., GTBank"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Number
              </label>
              <input
                type="text"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                placeholder="0123456789"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact
              </label>
              <input
                type="text"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                placeholder="Full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Phone
              </label>
              <input
                type="text"
                value={formData.emergencyPhone}
                onChange={(e) => setFormData({ ...formData, emergencyPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                placeholder="+234 800 000 0000"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/employees')}
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
              {loading ? 'Saving...' : isEdit ? 'Update Employee' : 'Add Employee'}
            </button>
          </div>
        </div>
      </form>

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateUserModal}
        onClose={() => setShowCreateUserModal(false)}
        title="Create New User"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateUser(); }} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name *
              </label>
              <input
                type="text"
                value={newUserData.firstName}
                onChange={(e) => setNewUserData({ ...newUserData, firstName: e.target.value })}
                className={`w-full px-3 py-2 border ${userErrors.firstName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
                required
              />
              {userErrors.firstName && <p className="mt-1 text-sm text-red-500">{userErrors.firstName}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name *
              </label>
              <input
                type="text"
                value={newUserData.lastName}
                onChange={(e) => setNewUserData({ ...newUserData, lastName: e.target.value })}
                className={`w-full px-3 py-2 border ${userErrors.lastName ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
                required
              />
              {userErrors.lastName && <p className="mt-1 text-sm text-red-500">{userErrors.lastName}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email *
            </label>
            <input
              type="email"
              value={newUserData.email}
              onChange={(e) => setNewUserData({ ...newUserData, email: e.target.value })}
              className={`w-full px-3 py-2 border ${userErrors.email ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              required
            />
            {userErrors.email && <p className="mt-1 text-sm text-red-500">{userErrors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password *
            </label>
            <input
              type="password"
              value={newUserData.password}
              onChange={(e) => setNewUserData({ ...newUserData, password: e.target.value })}
              className={`w-full px-3 py-2 border ${userErrors.password ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              required
              minLength={8}
            />
            {userErrors.password && <p className="mt-1 text-sm text-red-500">{userErrors.password}</p>}
            <p className="mt-1 text-xs text-gray-400">Minimum 8 characters</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Phone *
            </label>
            <input
              type="text"
              value={newUserData.phone}
              onChange={(e) => setNewUserData({ ...newUserData, phone: e.target.value })}
              className={`w-full px-3 py-2 border ${userErrors.phone ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              required
            />
            {userErrors.phone && <p className="mt-1 text-sm text-red-500">{userErrors.phone}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role *
            </label>
            <select
              value={newUserData.role}
              onChange={(e) => setNewUserData({ ...newUserData, role: e.target.value })}
              className={`w-full px-3 py-2 border ${userErrors.role ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              required
            >
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="REGIONAL_MANAGER">Regional Manager</option>
              <option value="SUPERVISOR">Supervisor</option>
              <option value="ATTENDANT">Attendant</option>
              <option value="ACCOUNTANT">Accountant</option>
            </select>
            {userErrors.role && <p className="mt-1 text-sm text-red-500">{userErrors.role}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Station *
            </label>
            <select
              value={newUserData.stationId}
              onChange={(e) => setNewUserData({ ...newUserData, stationId: e.target.value })}
              className={`w-full px-3 py-2 border ${userErrors.stationId ? 'border-red-500' : 'border-gray-300'} rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen`}
              required
            >
              <option value="">Select Station</option>
              {stations.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
            {userErrors.stationId && <p className="mt-1 text-sm text-red-500">{userErrors.stationId}</p>}
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowCreateUserModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creatingUser}
              className="flex items-center gap-2 px-6 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50"
            >
              <Save size={18} />
              {creatingUser ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeManagement;