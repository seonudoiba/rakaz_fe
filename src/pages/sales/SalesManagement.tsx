import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { salesApi } from "../../api/sales";
import { stationsApi } from "../../api/stations";
import { inventoryApi } from "../../api/inventory";
import { useStation } from '../../contexts/StationContext';
import {
  Plus,
  Search,
  Filter,
  Download,
  RefreshCw,
  ChevronDown,
  CheckCircle,
  Clock,
  AlertCircle,
  CreditCard,
  Wallet,
  Banknote,
  Building,
  Layers,
  X,
  Calendar,
  Lock,
  Filter as FilterIcon
} from "lucide-react";
import { Sale, PaymentMethod, TransactionStatus } from "../../types";
import {
  formatCurrency,
  formatDateTime,
  formatNumber,
  formatDate,
} from "../../utils/formatters";
import Loader from "../../components/common/Loader";
import SearchBar from "../../components/common/SearchBar";
import Pagination from "../../components/common/Pagination";
import Modal from "../../components/common/Modal";
import toast from "react-hot-toast";

type TimeRangeType = 'today' | 'week' | 'month' | 'quarter' | 'year' | 'custom' | 'all';

const SalesManagement: React.FC = () => {
  const { user } = useAuth();
  const { 
    selectedStationId, 
    isSuperAdmin, 
    isAllStations,
    stations,
    setSelectedStationId 
  } = useStation();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Time Range Filter
  const [timeRange, setTimeRange] = useState<TimeRangeType>('all');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const customDateRef = useRef<HTMLDivElement>(null);
  
  // Additional Filters
  const [productTypeFilter, setProductTypeFilter] = useState<string>('');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  const canEditProductPricing = user?.role === 'SUPER_ADMIN' || user?.role === 'REGIONAL_MANAGER';

  const [productPrices, setProductPrices] = useState<Array<{ productType: string; productName: string; unitPrice: number }>>([
    { productType: "PMS", productName: "Premium Motor Spirit", unitPrice: 650 },
    { productType: "AGO", productName: "Automotive Gas Oil", unitPrice: 1200 },
    { productType: "DPK", productName: "Dual Purpose Kerosene", unitPrice: 950 },
  ]);

  const [formData, setFormData] = useState({
    productType: "PMS",
    productName: "Premium Motor Spirit",
    quantity: 0,
    unitPrice: 650,
    paymentMethod: "CASH" as PaymentMethod,
    customerName: "",
    customerPhone: "",
  });

  useEffect(() => {
    fetchSales();
  }, [selectedStationId, timeRange, customStartDate, customEndDate, productTypeFilter, paymentMethodFilter, statusFilter]);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const prices = await inventoryApi.getProductPrices(selectedStationId || undefined);
        if (prices && prices.length > 0) {
          setProductPrices(prices);
          const defaultP = prices.find((p) => p.productType === formData.productType) || prices[0];
          setFormData((prev) => ({
            ...prev,
            productType: defaultP.productType,
            productName: defaultP.productName,
            unitPrice: defaultP.unitPrice,
          }));
        }
      } catch (err) {
        console.error("Error fetching product prices:", err);
      }
    };
    fetchPrices();
  }, [selectedStationId]);

  const handleProductTypeChange = (newType: string) => {
    const matched = productPrices.find((p) => p.productType === newType);
    if (matched) {
      setFormData((prev) => ({
        ...prev,
        productType: newType,
        productName: matched.productName,
        unitPrice: matched.unitPrice,
      }));
    } else {
      setFormData((prev) => ({ ...prev, productType: newType }));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (customDateRef.current && !customDateRef.current.contains(event.target as Node)) {
        setShowCustomDatePicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getDateRange = () => {
    const now = new Date();
    let startDate = new Date();
    let endDate = new Date();

    switch (timeRange) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        break;
      case 'week':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(startDate.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case 'custom':
        startDate = new Date(customStartDate);
        endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'all':
      default:
        startDate = new Date(2020, 0, 1);
        break;
    }

    return { startDate, endDate };
  };

  const getTimeRangeLabel = () => {
    switch (timeRange) {
      case 'today': return 'Today';
      case 'week': return 'This Week';
      case 'month': return 'This Month';
      case 'quarter': return 'This Quarter';
      case 'year': return 'This Year';
      case 'custom': return `Custom: ${formatDate(customStartDate)} - ${formatDate(customEndDate)}`;
      case 'all': return 'All Time';
      default: return 'All Time';
    }
  };

  const fetchSales = async () => {
    try {
      setLoading(true);
      
      const { startDate, endDate } = getDateRange();

      let salesData: Sale[] = [];

      // Determine which stations to fetch from
      let targetStations: any[] = [];
      if (isAllStations && isSuperAdmin) {
        const allStations = await stationsApi.getAll();
        targetStations = allStations;
      } else if (selectedStationId) {
        targetStations = [{ id: selectedStationId }];
      } else {
        setSales([]);
        setTotalPages(0);
        setLoading(false);
        return;
      }

      // Fetch sales from all target stations
      const salesPromises = targetStations.map(station => 
        salesApi.getStationSales(station.id, startDate.toISOString(), endDate.toISOString())
      );
      const allSalesData = await Promise.all(salesPromises);
      salesData = allSalesData.flat();

      // Apply filters
      if (productTypeFilter) {
        salesData = salesData.filter(s => s.productType === productTypeFilter);
      }
      if (paymentMethodFilter) {
        salesData = salesData.filter(s => s.paymentMethod === paymentMethodFilter);
      }
      if (statusFilter) {
        salesData = salesData.filter(s => s.status === statusFilter);
      }

      setSales(salesData);
      setTotalPages(Math.ceil(salesData.length / 10));
    } catch (error) {
      console.error("Error fetching sales:", error);
      toast.error("Failed to load sales");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSale = async () => {
    try {
      const stationId = isAllStations ? null : selectedStationId;
      
      if (!stationId && !isAllStations) {
        toast.error("No station selected. Please select a station first.");
        return;
      }

      const effectiveStationId = stationId || (stations.length > 0 ? stations[0].id : null);
      
      if (!effectiveStationId) {
        toast.error("No stations available to create a sale");
        return;
      }

      if (formData.quantity <= 0) {
        toast.error("Quantity must be greater than 0");
        return;
      }

      if (formData.unitPrice <= 0) {
        toast.error("Unit price must be greater than 0");
        return;
      }

      const saleData = {
        productType: formData.productType,
        productName: formData.productName,
        quantity: formData.quantity,
        unitPrice: formData.unitPrice,
        totalAmount: formData.quantity * formData.unitPrice,
        paymentMethod: formData.paymentMethod,
        customerName: formData.customerName || null,
        customerPhone: formData.customerPhone || null,
        stationId: effectiveStationId,
        attendantId: user?.id,
      };

      await salesApi.createSale(saleData);
      toast.success("Sale recorded successfully");
      setShowCreateModal(false);
      fetchSales();
      setFormData({
        productType: "PMS",
        productName: "Premium Motor Spirit",
        quantity: 0,
        unitPrice: 225,
        paymentMethod: "CASH" as PaymentMethod,
        customerName: "",
        customerPhone: "",
      });
    } catch (error: any) {
      console.error("Error creating sale:", error);
      toast.error(error.response?.data?.message || "Failed to record sale");
    }
  };

  const handleVerifySale = async (saleId: string) => {
    try {
      await salesApi.verifySale(saleId);
      toast.success("Sale verified");
      fetchSales();
    } catch (error) {
      toast.error("Failed to verify sale");
    }
  };

  const clearFilters = () => {
    setProductTypeFilter('');
    setPaymentMethodFilter('');
    setStatusFilter('');
    setSearchTerm('');
    setTimeRange('all');
  };

  // Calculate totals from real data
  const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalVolume = sales.reduce((sum, s) => sum + s.quantity, 0);
  const avgTransaction = sales.length > 0 ? totalSales / sales.length : 0;

  const filteredSales = sales.filter(
    (sale) =>
      sale.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.attendant?.firstName
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (sale as any).voucherNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  const getPaymentIcon = (method: PaymentMethod) => {
    switch (method) {
      case "CASH":
        return <Banknote size={16} className="text-green-600" />;
      case "POS":
        return <CreditCard size={16} className="text-blue-600" />;
      case "TRANSFER":
        return <Wallet size={16} className="text-purple-600" />;
      case "CREDIT":
        return <CreditCard size={16} className="text-yellow-600" />;
    }
  };

  const getStatusIcon = (status: TransactionStatus) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle size={16} className="text-green-500" />;
      case "VERIFIED":
        return <CheckCircle size={16} className="text-blue-500" />;
      case "PENDING":
        return <Clock size={16} className="text-yellow-500" />;
      default:
        return <AlertCircle size={16} className="text-red-500" />;
    }
  };

  const getStationDisplay = () => {
    if (isAllStations && isSuperAdmin) return "All Stations";
    const station = stations.find(s => s.id === selectedStationId);
    return station ? `${station.name} (${station.code})` : "No Station";
  };

  // Count active filters
  const activeFilterCount = [
    productTypeFilter, 
    paymentMethodFilter, 
    statusFilter, 
    searchTerm,
    timeRange !== 'all'
  ].filter(Boolean).length;

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Sales Management</h1>
          <p className="text-gray-500">
            Monitor and manage all sales transactions
          </p>
          <div className="mt-1 text-sm text-petroleum-seagreen flex items-center gap-2">
            {isAllStations && isSuperAdmin ? (
              <Layers size={16} />
            ) : (
              <Building size={16} />
            )}
            <span>{getStationDisplay()}</span>
            <span>•</span>
            <span>{getTimeRangeLabel()}</span>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
          >
            <Plus size={18} />
            New Sale
          </button>
          <button
            onClick={fetchSales}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors relative"
          >
            <FilterIcon size={18} />
            Filters
            {activeFilterCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-petroleum-seagreen text-petroleum-dark text-xs rounded-full flex items-center justify-center">
                {activeFilterCount}
              </span>
            )}
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Download size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Filters Section */}
      {showFilters && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <FilterIcon size={18} />
              Filters
              {activeFilterCount > 0 && (
                <span className="text-sm text-gray-500 font-normal">
                  ({activeFilterCount} active)
                </span>
              )}
            </h3>
            <div className="flex gap-2">
              <button
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setShowFilters(false)}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Time Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Time Range</label>
              <div className="relative" ref={customDateRef}>
                <select
                  value={timeRange}
                  onChange={(e) => {
                    const value = e.target.value as TimeRangeType;
                    setTimeRange(value);
                    if (value === 'custom') {
                      setShowCustomDatePicker(true);
                    } else {
                      setShowCustomDatePicker(false);
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen bg-white"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">This Week</option>
                  <option value="month">This Month</option>
                  <option value="quarter">This Quarter</option>
                  <option value="year">This Year</option>
                  <option value="custom">Custom Range</option>
                </select>
                {showCustomDatePicker && (
                  <div className="absolute top-full left-0 mt-2 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 flex flex-col gap-2 w-full">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">From</label>
                        <input
                          type="date"
                          value={customStartDate}
                          onChange={(e) => setCustomStartDate(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-xs text-gray-500">To</label>
                        <input
                          type="date"
                          value={customEndDate}
                          onChange={(e) => setCustomEndDate(e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                        />
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setShowCustomDatePicker(false);
                        fetchSales();
                      }}
                      className="w-full py-1 bg-petroleum-seagreen text-petroleum-dark text-sm rounded hover:bg-petroleum-seagreen/90 transition-colors"
                    >
                      Apply
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Product Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
              <select
                value={productTypeFilter}
                onChange={(e) => setProductTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen bg-white"
              >
                <option value="">All Products</option>
                <option value="PMS">PMS (Premium)</option>
                <option value="AGO">AGO (Diesel)</option>
                <option value="DPK">DPK (Kerosene)</option>
                <option value="LPG">LPG (Gas)</option>
              </select>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen bg-white"
              >
                <option value="">All Methods</option>
                <option value="CASH">Cash</option>
                <option value="POS">POS</option>
                <option value="TRANSFER">Bank Transfer</option>
                <option value="CREDIT">Credit</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen bg-white"
              >
                <option value="">All Status</option>
                <option value="COMPLETED">Completed</option>
                <option value="VERIFIED">Verified</option>
                <option value="PENDING">Pending</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={fetchSales}
              className="px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSales)}</p>
          <p className="text-xs text-gray-500">{sales.length} transactions</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Total Volume</p>
          <p className="text-2xl font-bold text-blue-600">{formatNumber(totalVolume)} L</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Avg Transaction</p>
          <p className="text-2xl font-bold text-purple-600">{formatCurrency(avgTransaction)}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
          <p className="text-sm text-gray-500">Viewing</p>
          <p className="text-2xl font-bold text-petroleum-seagreen text-sm truncate">
            {getStationDisplay()}
          </p>
        </div>
      </div>

      

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by product, customer, attendant, or voucher..."
          />
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Date & Time</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Product</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Quantity</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Amount</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Payment</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Attendant</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Status</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedSales.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-gray-500">
                    No sales found for the selected filters
                  </td>
                </tr>
              ) : (
                paginatedSales.map((sale) => (
                  <tr key={sale.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm">{formatDateTime(sale.createdAt)}</td>
                    <td className="py-3 px-4">
                      <div>
                        <p className="text-sm font-medium">{sale.productName}</p>
                        <p className="text-xs text-gray-500">{sale.productType}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm">{formatNumber(sale.quantity)} L</td>
                    <td className="py-3 px-4 text-sm font-medium">{formatCurrency(sale.totalAmount)}</td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        sale.paymentMethod === "CASH"
                          ? "bg-green-100 text-green-700"
                          : sale.paymentMethod === "POS"
                            ? "bg-blue-100 text-blue-700"
                            : sale.paymentMethod === "TRANSFER"
                              ? "bg-purple-100 text-purple-700"
                              : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {getPaymentIcon(sale.paymentMethod)}
                        {sale.paymentMethod}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm">
                      {sale.attendant?.firstName} {sale.attendant?.lastName}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                        sale.status === "COMPLETED"
                          ? "bg-green-100 text-green-700"
                          : sale.status === "VERIFIED"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-yellow-100 text-yellow-700"
                      }`}>
                        {getStatusIcon(sale.status)}
                        {sale.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {sale.status === "COMPLETED" && (
                        <button
                          onClick={() => handleVerifySale(sale.id)}
                          className="text-sm text-blue-600 hover:underline"
                        >
                          Verify
                        </button>
                      )}
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

      {/* Create Sale Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Record New Sale"
        size="md"
      >
        <form onSubmit={(e) => { e.preventDefault(); handleCreateSale(); }} className="space-y-4">
          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Station:</strong>{" "}
              {isAllStations && isSuperAdmin 
                ? "All Stations (will use first station)" 
                : stations.find((s) => s.id === selectedStationId)?.name || "Not selected"
              }
            </p>
          </div>

          {!canEditProductPricing && (
            <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg flex items-center gap-2 text-xs text-amber-800">
              <Lock size={14} className="text-amber-600 shrink-0" />
              <span>Product prices are set by Regional Manager / Super Admin and cannot be edited.</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Product Type</label>
              <select
                value={formData.productType}
                onChange={(e) => handleProductTypeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              >
                {productPrices.map((p) => (
                  <option key={p.productType} value={p.productType}>
                    {p.productType} ({p.productName})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                <span>Product Name</span>
                {!canEditProductPricing && <Lock size={12} className="text-gray-400" />}
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                disabled={!canEditProductPricing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen ${
                  !canEditProductPricing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (L)</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center justify-between">
                <span>Unit Price (₦)</span>
                {!canEditProductPricing && <Lock size={12} className="text-gray-400" />}
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.unitPrice}
                onChange={(e) => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })}
                disabled={!canEditProductPricing}
                className={`w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen ${
                  !canEditProductPricing ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                }`}
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
            <select
              value={formData.paymentMethod}
              onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value as PaymentMethod })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
            >
              <option value="CASH">Cash</option>
              <option value="POS">POS</option>
              <option value="TRANSFER">Bank Transfer</option>
              <option value="CREDIT">Credit</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name</label>
              <input
                type="text"
                value={formData.customerName}
                onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
              <input
                type="text"
                value={formData.customerPhone}
                onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
              />
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Amount:</span>
              <span className="font-bold text-gray-900">
                {formatCurrency(formData.quantity * formData.unitPrice)}
              </span>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              Record Sale
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default SalesManagement;