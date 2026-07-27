import React from 'react';
import { Sale } from '../../types';
import { formatCurrency, formatDateTime } from '../../utils/formatters';
import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

interface TransactionCardProps {
  transaction: Sale;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'COMPLETED':
      case 'VERIFIED':
        return <CheckCircle className="text-green-500" size={16} />;
      case 'PENDING':
        return <Clock className="text-yellow-500" size={16} />;
      default:
        return <AlertCircle className="text-red-500" size={16} />;
    }
  };

  return (
    <div className="flex items-center justify-between p-3 border-b border-gray-100 hover:bg-gray-50 transition-colors">
      <div className="flex items-center gap-3">
        {getStatusIcon(transaction.status)}
        <div>
          <p className="text-sm font-medium">{transaction.productName}</p>
          <p className="text-xs text-gray-500">{formatDateTime(transaction.createdAt)}</p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-600">{transaction.quantity} L</span>
        <span className="text-sm font-medium">{formatCurrency(transaction.totalAmount)}</span>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          transaction.paymentMethod === 'CASH' ? 'bg-green-100 text-green-700' :
          transaction.paymentMethod === 'POS' ? 'bg-blue-100 text-blue-700' :
          transaction.paymentMethod === 'TRANSFER' ? 'bg-purple-100 text-purple-700' :
          'bg-yellow-100 text-yellow-700'
        }`}>
          {transaction.paymentMethod}
        </span>
        <span className="text-xs text-gray-500">{transaction.attendant.firstName}</span>
      </div>
    </div>
  );
};