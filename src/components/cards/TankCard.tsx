import React from 'react';
import { Tank } from '../../types';
import { AlertTriangle, CheckCircle, AlertCircle } from 'lucide-react';

interface TankCardProps {
  tank: Tank;
}

export const TankCard: React.FC<TankCardProps> = ({ tank }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'text-green-600 bg-green-50';
      case 'WARNING': return 'text-yellow-600 bg-yellow-50';
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'NORMAL': return <CheckCircle size={16} />;
      case 'WARNING': return <AlertTriangle size={16} />;
      case 'CRITICAL': return <AlertCircle size={16} />;
      default: return null;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'NORMAL': return 'Normal';
      case 'WARNING': return 'Warning';
      case 'CRITICAL': return 'Critical';
      default: return status;
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-medium">{tank.name}</p>
          <p className="text-xs text-gray-500">Capacity: {tank.capacity.toLocaleString()} L</p>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(tank.status)}`}>
          {getStatusIcon(tank.status)}
          {getStatusText(tank.status)}
        </span>
      </div>
      
      <div className="mt-3">
        <div className="flex items-center justify-between text-sm">
          <span>{tank.percentage}%</span>
          <span>{tank.currentLevel.toLocaleString()} L</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full mt-1 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-500 ${
              tank.percentage > 60 ? 'bg-green-500' :
              tank.percentage > 30 ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${tank.percentage}%` }}
          />
        </div>
      </div>
      
      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>Product: {tank.productType}</span>
        <span>Updated: {new Date(tank.lastUpdated).toLocaleTimeString()}</span>
      </div>
    </div>
  );
};