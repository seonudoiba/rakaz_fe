import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supportApi } from '../../api/support';
import {
  ArrowLeft, RefreshCw, Send, User, Calendar,
  Tag, AlertCircle, CheckCircle, Clock,
  MessageSquare, Edit, Users, Mail
} from 'lucide-react';
import { SupportTicket, SupportTicketStatus, SupportTicketPriority } from '../../types';
import { formatDateTime } from '../../utils/formatters';
import Loader from '../../components/common/Loader';
import Modal from '../../components/common/Modal';
import toast from 'react-hot-toast';

const TicketDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    if (id) {
      fetchTicket();
    }
  }, [id]);

  const fetchTicket = async () => {
    try {
      setLoading(true);
      const data = await supportApi.getById(id!);
      setTicket(data);
    } catch (error) {
      console.error('Error fetching ticket:', error);
      toast.error('Failed to load ticket details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await supportApi.addComment(id!, newComment, isInternal);
      toast.success('Comment added successfully');
      setNewComment('');
      fetchTicket();
    } catch (error) {
      toast.error('Failed to add comment');
    }
  };

  const handleResolve = async () => {
    try {
      await supportApi.resolve(id!);
      toast.success('Ticket resolved successfully');
      fetchTicket();
    } catch (error) {
      toast.error('Failed to resolve ticket');
    }
  };

  const handleAssign = async (userId: string) => {
    try {
      await supportApi.update(id!, { assignedToId: userId });
      toast.success('Ticket assigned successfully');
      setShowAssignModal(false);
      fetchTicket();
    } catch (error) {
      toast.error('Failed to assign ticket');
    }
  };

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

  if (loading) return <Loader fullScreen text="Loading ticket details..." />;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/support')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{ticket.title}</h1>
            <p className="text-gray-500">Ticket #{ticket.ticketNumber}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
            <button
              onClick={handleResolve}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              <CheckCircle size={16} />
              Resolve
            </button>
          )}
          <button
            onClick={() => setShowAssignModal(true)}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users size={16} />
            Assign
          </button>
          <button
            onClick={fetchTicket}
            className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={18} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 whitespace-pre-wrap">{ticket.description}</p>
          </div>

          {/* Comments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Comments ({ticket.comments.length})
            </h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {ticket.comments.map((comment) => (
                <div key={comment.id} className={`p-4 rounded-lg ${comment.isInternal ? 'bg-yellow-50 border border-yellow-200' : 'bg-gray-50'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-petroleum-seagreen flex items-center justify-center text-petroleum-dark text-xs font-bold">
                        {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-medium">{comment.user?.firstName} {comment.user?.lastName}</p>
                        <p className="text-xs text-gray-500">{formatDateTime(comment.createdAt)}</p>
                      </div>
                    </div>
                    {comment.isInternal && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-200 text-yellow-800">
                        Internal
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-700">{comment.message}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="mt-4">
              <div className="flex items-start gap-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim()}
                  className="px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium disabled:opacity-50"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={isInternal}
                  onChange={(e) => setIsInternal(e.target.checked)}
                  className="rounded text-petroleum-seagreen focus:ring-petroleum-seagreen"
                />
                <label className="text-sm text-gray-600">Internal comment (staff only)</label>
              </div>
            </form>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Details</h3>
            
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(ticket.status)}`}>
                  {ticket.status === 'OPEN' && <AlertCircle size={12} />}
                  {ticket.status === 'IN_PROGRESS' && <Clock size={12} />}
                  {ticket.status === 'RESOLVED' && <CheckCircle size={12} />}
                  {ticket.status}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">Priority</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(ticket.priority)}`}>
                  {ticket.priority}
                </span>
              </div>

              <div>
                <p className="text-sm text-gray-500">Category</p>
                <p className="font-medium">{ticket.category}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Created By</p>
                <p className="font-medium">{ticket.createdBy?.firstName} {ticket.createdBy?.lastName}</p>
                <p className="text-sm text-gray-500">{ticket.createdBy?.email}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Assigned To</p>
                <p className="font-medium">{ticket.assignedTo?.firstName || 'Unassigned'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-500">Created</p>
                <p className="text-sm">{formatDateTime(ticket.createdAt)}</p>
              </div>

              {ticket.resolvedAt && (
                <div>
                  <p className="text-sm text-gray-500">Resolved</p>
                  <p className="text-sm">{formatDateTime(ticket.resolvedAt)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title="Assign Ticket"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Select a user to assign this ticket to:</p>
          <select className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-petroleum-seagreen">
            <option value="">Select User</option>
            <option value="1">John Doe (Support)</option>
            <option value="2">Jane Smith (Support)</option>
            <option value="3">Bob Johnson (Developer)</option>
          </select>
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              onClick={() => setShowAssignModal(false)}
              className="px-4 py-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={() => handleAssign('1')}
              className="px-4 py-2 bg-petroleum-seagreen text-petroleum-dark rounded-lg hover:bg-petroleum-seagreen/90 transition-colors font-medium"
            >
              Assign Ticket
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TicketDetails;