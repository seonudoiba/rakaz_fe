import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { reportsApi } from '../../api/reports';
import {
  ArrowLeft, FileText, Download, Calendar,
  Filter, ChevronDown, CheckCircle, AlertCircle,
  Printer, Mail, Share2
} from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import toast from 'react-hot-toast';

const ReportGenerator: React.FC = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [reportType, setReportType] = useState('sales');
  const [format, setFormat] = useState('pdf');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
    end: new Date(),
  });
  const [filters, setFilters] = useState({
    stationId: '',
    productType: '',
    paymentMethod: '',
  });
  const [reportData, setReportData] = useState<any>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const data = await reportsApi.generateReport({
        type: reportType,
        startDate: dateRange.start.toISOString(),
        endDate: dateRange.end.toISOString(),
        ...filters,
      });
      setReportData(data);
      setGenerated(true);
      toast.success('Report generated successfully');
    } catch (error) {
      console.error('Error generating report:', error);
      toast.error('Failed to generate report');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      await reportsApi.exportReport(reportType, reportData, format);
      toast.success(`Report exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Failed to export report');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Report Generator</h1>
          <p className="text-gray-500">Create custom reports with advanced filters</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Report Configuration */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Configuration</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Report Type
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              >
                <option value="sales">Sales Report</option>
                <option value="financial">Financial Report</option>
                <option value="inventory">Inventory Report</option>
                <option value="station">Station Performance</option>
                <option value="employee">Employee Performance</option>
                <option value="tax">Tax Compliance</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={dateRange.start.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange({ ...dateRange, start: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={dateRange.end.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange({ ...dateRange, end: new Date(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Station (Optional)
              </label>
              <select
                value={filters.stationId}
                onChange={(e) => setFilters({ ...filters, stationId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              >
                <option value="">All Stations</option>
                <option value="alpha">Station Alpha</option>
                <option value="beta">Station Beta</option>
                <option value="gamma">Station Gamma</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Type
                </label>
                <select
                  value={filters.productType}
                  onChange={(e) => setFilters({ ...filters, productType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                >
                  <option value="">All Products</option>
                  <option value="PMS">PMS (Premium)</option>
                  <option value="AGO">AGO (Diesel)</option>
                  <option value="DPK">DPK (Kerosene)</option>
                  <option value="LPG">LPG (Gas)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Payment Method
                </label>
                <select
                  value={filters.paymentMethod}
                  onChange={(e) => setFilters({ ...filters, paymentMethod: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                >
                  <option value="">All Methods</option>
                  <option value="CASH">Cash</option>
                  <option value="POS">POS</option>
                  <option value="TRANSFER">Bank Transfer</option>
                  <option value="CREDIT">Credit</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Export Format
              </label>
              <div className="flex gap-3">
                {['pdf', 'excel', 'csv'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setFormat(f)}
                    className={`px-4 py-2 border rounded-lg transition-colors ${
                      format === f
                        ? 'border-petroleum-seagreen bg-petroleum-seagreen/10 text-petroleum-seagreen'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    {f.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full py-3 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader size="sm" />
                  Generating...
                </span>
              ) : (
                'Generate Report'
              )}
            </button>
          </div>
        </div>

        {/* Report Preview */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Preview</h3>
          
          {generated && reportData ? (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle size={20} />
                <span className="font-medium">Report Ready</span>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-500">Summary</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm">Total Records: {reportData.records || 0}</p>
                  <p className="text-sm">Total Amount: {formatCurrency(reportData.total || 0)}</p>
                  <p className="text-sm">Date Range: {dateRange.start.toLocaleDateString()} - {dateRange.end.toLocaleDateString()}</p>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleExport}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
                >
                  <Download size={18} />
                  Download {format.toUpperCase()}
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Printer size={18} />
                  Print
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Mail size={18} />
                  Email Report
                </button>
                <button className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <Share2 size={18} />
                  Share
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <FileText className="mx-auto text-gray-300 mb-4" size={48} />
              <p className="text-gray-500">Configure your report settings</p>
              <p className="text-sm text-gray-400">and click "Generate Report"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReportGenerator;