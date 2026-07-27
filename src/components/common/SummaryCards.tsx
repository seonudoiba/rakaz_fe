import React from 'react';
import { formatCurrency, formatNumber } from '../../utils/formatters';

interface SummaryCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'red' | 'purple' | 'yellow';
}

const colorMap = {
  blue: 'text-blue-600',
  green: 'text-green-600',
  red: 'text-red-600',
  purple: 'text-purple-600',
  yellow: 'text-yellow-600',
};

export const SummaryCard: React.FC<SummaryCardProps> = ({ 
  title, 
  value, 
  subtitle, 
  color = 'blue' 
}) => {
  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500">{title}</p>
      <p className={`text-2xl font-bold ${colorMap[color]}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
    </div>
  );
};

export const SummaryGrid: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {children}
    </div>
  );
};