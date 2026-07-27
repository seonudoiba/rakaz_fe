import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

export const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const rawUrl = import.meta.env.VITE_WEBSOCKET_URL || import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const socketUrl = rawUrl.startsWith('ws')
      ? rawUrl.replace(/^ws/, 'http')
      : new URL(rawUrl).origin;

    const socketInstance = io(socketUrl, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketInstance.on('connect', () => {
      console.log('Socket connected');
      setIsConnected(true);
      toast.success('Real-time connection established');
    });

    socketInstance.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    socketInstance.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setIsConnected(false);
    });

    // Real-time event handlers
    socketInstance.on('tank:update', (data) => {
      console.log('Tank update:', data);
      // Update tank levels in UI
    });

    socketInstance.on('sale:new', (data) => {
      console.log('New sale:', data);
      toast.success(`New sale: ${data.productName || 'Product'} - ${data.amount || '₦0'}`);
    });

    socketInstance.on('delivery:update', (data) => {
      console.log('Delivery update:', data);
      toast(`Delivery ${data.deliveryId || ''} status: ${data.status || 'Updated'}`, {
        icon: '🚚',
        duration: 4000,
      });
    });

    socketInstance.on('alert:new', (data) => {
      console.log('Alert:', data);
      toast.error(data.message || 'Alert received');
    });

    socketInstance.on('notification:new', (data) => {
      console.log('Notification:', data);
      toast(data.message || 'New notification', {
        icon: '🔔',
        duration: 5000,
      });
    });

    // System status updates
    socketInstance.on('system:status', (data) => {
      console.log('System status:', data);
      if (data.status === 'degraded') {
        toast('System performance degraded', {
          icon: '⚠️',
          duration: 5000,
        });
      }
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
      setIsConnected(false);
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};