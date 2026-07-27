import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { employeesApi } from '../../api/employees';
import { usersApi } from '../../api/users';
import {
  ArrowLeft, Edit, Mail, Phone, MapPin,
  Calendar, User, Building, DollarSign,
  CreditCard, Shield, Clock, CheckCircle
} from 'lucide-react';
import { Employee } from '../../types';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const EmployeeDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [activityLog, setActivityLog] = useState<any[]>([]);

  useEffect(() => {
    if (id) {
      fetchEmployeeDetails();
    }
  }, [id]);

  const fetchEmployeeDetails = async () => {
    try {
      setLoading(true);
      const data = await employeesApi.getById(id!);
      setEmployee(data);
      // Fetch activity logs
      const logs = await usersApi.getActivityLog(data.userId);
      setActivityLog(logs || []);
    } catch (error) {
      console.error('Error fetching employee details:', error);
      toast.error('Failed to load employee details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Loader fullScreen text="Loading employee details..." />;
  if (!employee) return <div>Employee not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/employees')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-petroleum-seagreen flex items-center justify-center text-petroleum-dark font-bold text-2xl">
              {employee.user?.firstName?.[0]}{employee.user?.lastName?.[0]}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {employee.user?.firstName} {employee.user?.lastName}
              </h1>
              <p className="text-gray-500">{employee.position} • {employee.employeeId}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/employees/management?id=${employee.id}`)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Edit size={16} />
            Edit
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium">
            <CheckCircle size={16} />
            Mark Present
          </button>
        </div>
      </div>

      {/* Employee Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Mail className="text-blue-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Email</p>
              <p className="text-sm font-medium">{employee.user?.email}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <Phone className="text-green-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Phone</p>
              <p className="text-sm font-medium">{employee.user?.phone}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <Building className="text-purple-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="text-sm font-medium">{employee.department}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <Clock className="text-yellow-600" size={20} />
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className={`text-sm font-medium ${employee.user?.isActive ? 'text-green-600' : 'text-red-600'}`}>
                {employee.user?.isActive ? 'Active' : 'Inactive'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Details */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Employee ID</p>
              <p className="font-medium">{employee.employeeId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Role</p>
              <p className="font-medium">{employee.user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Position</p>
              <p className="font-medium">{employee.position}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Department</p>
              <p className="font-medium">{employee.department}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Hire Date</p>
              <p className="font-medium">{formatDate(employee.hireDate)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Salary</p>
              <p className="font-medium">{employee.salary ? formatCurrency(employee.salary) : 'N/A'}</p>
            </div>
          </div>

          {employee.bankName && employee.accountNumber && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Bank Details</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Bank</p>
                  <p className="font-medium">{employee.bankName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Account Number</p>
                  <p className="font-medium">{employee.accountNumber}</p>
                </div>
              </div>
            </div>
          )}

          {employee.emergencyContact && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Emergency Contact</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Contact</p>
                  <p className="font-medium">{employee.emergencyContact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium">{employee.emergencyPhone}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-4">
            {activityLog.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No activity recorded</p>
            ) : (
              activityLog.slice(0, 10).map((log) => (
                <div key={log.id} className="flex items-start gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${
                    log.type === 'login' ? 'bg-green-500' :
                    log.type === 'logout' ? 'bg-red-500' :
                    'bg-blue-500'
                  }`} />
                  <div>
                    <p className="text-sm font-medium">{log.action}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(log.createdAt)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Station Info */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Station Assignment</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-gray-500">Station</p>
            <p className="font-medium">{employee.station?.name}</p>
            <p className="text-sm text-gray-500">{employee.station?.address}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Station Code</p>
            <p className="font-medium">{employee.station?.code}</p>
            <p className="text-sm text-gray-500">{employee.station?.city}, {employee.station?.state}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeDetails;