import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supportApi } from '../../api/support';
import {
  Plus, Search, Filter, RefreshCw,
  Eye, Edit, CheckCircle, Clock, AlertCircle,
  MessageSquare, User, Calendar, Tag
} from 'lucide-react';
import { SupportTicket, SupportTicketStatus, SupportTicketPriority } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import SearchBar from '../../components/common/SearchBar';
import Pagination from '../../components/common/Pagination';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const SupportTickets: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);

  useEffect(() => {
    fetchTickets();
  }, [currentPage, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getAllTickets({
        status: statusFilter as SupportTicketStatus || undefined,
        priority: priorityFilter as SupportTicketPriority || undefined,
      });
      setTickets(data);
      setTotalPages(Math.ceil(data.length / 10));
    } catch (error) {
      console.error('Error fetching tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await supportApi.resolve(id);
      toast.success('Ticket resolved successfully');
      fetchTickets();
    } catch (error) {
      toast.error('Failed to resolve ticket');
    }
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * 10,
    currentPage * 10
  );

  const getStatusColor = (status: string) => {
    const colors = {
      OPEN: 'bg-green-100 text-green-700',
      IN_PROGRESS: 'bg-blue-100 text-blue-700',
      RESOLVED: 'bg-purple-100 text-purple-700',
      CLOSED: 'bg-gray-100 text-gray-700',
    };
    return colors[status as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  const getPriorityColor = (priority: string) => {
    const colors = {
      LOW: 'bg-gray-100 text-gray-700',
      MEDIUM: 'bg-blue-100 text-blue-700',
      HIGH: 'bg-yellow-100 text-yellow-700',
      URGENT: 'bg-red-100 text-red-700',
    };
    return colors[priority as keyof typeof colors] || 'bg-gray-100 text-gray-700';
  };

  if (loading) return <Loader />;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support Tickets</h1>
          <p className="text-gray-500">Manage support requests and issues</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/support/create')}
            className="flex items-center gap-2 px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
          >
            <Plus size={18} />
            New Ticket
          </button>
          <button
            onClick={fetchTickets}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{tickets.length}</p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Open</p>
          <p className="text-2xl font-bold text-green-600">
            {tickets.filter(t => t.status === 'OPEN').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">In Progress</p>
          <p className="text-2xl font-bold text-blue-600">
            {tickets.filter(t => t.status === 'IN_PROGRESS').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Resolved</p>
          <p className="text-2xl font-bold text-purple-600">
            {tickets.filter(t => t.status === 'RESOLVED').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 text-center">
          <p className="text-sm text-gray-500">Urgent</p>
          <p className="text-2xl font-bold text-red-600">
            {tickets.filter(t => t.priority === 'URGENT').length}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <SearchBar
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by title, ticket number, or category..."
          />
        </div>
        <div className="flex gap-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          >
            <option value="">All Status</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </select>
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
          >
            <option value="">All Priority</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="URGENT">Urgent</option>
          </select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Ticket</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Title</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Category</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Priority</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Status</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Created</th>
                <th className="text-left text-sm font-medium text-gray-500 py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.map((ticket) => (
                <tr key={ticket.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-3 px-4">
                    <span className="font-mono text-sm font-medium text-petroleum-seagreen">
                      {ticket.ticketNumber}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <p className="font-medium text-sm">{ticket.title}</p>
                      <p className="text-xs text-gray-500">by {ticket.createdBy?.firstName}</p>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                      {ticket.category}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                      {ticket.priority}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'OPEN' && <AlertCircle size={12} />}
                      {ticket.status === 'IN_PROGRESS' && <Clock size={12} />}
                      {ticket.status === 'RESOLVED' && <CheckCircle size={12} />}
                      {ticket.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm">{formatDateTime(ticket.createdAt)}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedTicket(ticket);
                          setShowDetailsModal(true);
                        }}
                        className="p-1 text-gray-500 hover:text-petroleum-seagreen transition-colors"
                        title="View Details"
                      >
                        <Eye size={18} />
                      </button>
                      {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                        <button
                          onClick={() => handleResolve(ticket.id)}
                          className="p-1 text-green-500 hover:text-green-700 transition-colors"
                          title="Resolve"
                        >
                          <CheckCircle size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => navigate(`/support/${ticket.id}`)}
                        className="p-1 text-blue-500 hover:text-blue-700 transition-colors"
                        title="Add Comment"
                      >
                        <MessageSquare size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
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

      {/* Details Modal */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => setShowDetailsModal(false)}
        title="Ticket Details"
        size="lg"
      >
        {selectedTicket && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Ticket Number</p>
                <p className="font-bold text-petroleum-seagreen">{selectedTicket.ticketNumber}</p>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(selectedTicket.status)}`}>
                {selectedTicket.status}
              </span>
            </div>

            <div>
              <p className="text-sm text-gray-500">Title</p>
              <p className="font-medium">{selectedTicket.title}</p>
            </div>

            <div>
              <p className="text-sm text-gray-500">Description</p>
              <p className="text-sm text-gray-600">{selectedTicket.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{selectedTicket.category}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(selectedTicket.priority)}`}>
                  {selectedTicket.priority}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">{selectedTicket.createdBy?.firstName} {selectedTicket.createdBy?.lastName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium">{selectedTicket.assignedTo?.firstName || 'Unassigned'}</p>
              </div>
            </div>

            {selectedTicket.resolvedAt && (
              <div>
                <p className="text-sm text-gray-500">Resolved</p>
                <p className="font-medium">{formatDateTime(selectedTicket.resolvedAt)}</p>
              </div>
            )}

            {selectedTicket.comments.length > 0 && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2">Comments</p>
                <div className="space-y-3">
                  {selectedTicket.comments.slice(0, 3).map((comment) => (
                    <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{comment.user?.firstName}</span>
                        <span className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-600">{comment.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default SupportTickets;