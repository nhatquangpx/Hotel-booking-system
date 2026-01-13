import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

/**
 * Custom hook để quản lý Socket.io connection
 * Tự động kết nối/disconnect khi user login/logout
 */
export const useSocket = (onNotification, onUnreadCountUpdate) => {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const callbacksRef = useRef({ onNotification, onUnreadCountUpdate });

  // Lấy server URL từ env hoặc mặc định
  const getServerUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      // Nếu có VITE_API_URL, lấy base URL (bỏ /api)
      const baseUrl = envUrl.replace('/api', '');
      return baseUrl;
    }
    // Mặc định localhost:8001
    return 'http://localhost:8001';
  };

  // Update callbacks ref when they change
  useEffect(() => {
    callbacksRef.current = { onNotification, onUnreadCountUpdate };
  }, [onNotification, onUnreadCountUpdate]);

  useEffect(() => {
    // Chỉ kết nối nếu có user và token
    // User object từ MongoDB có _id, không phải id
    const userId = user?._id || user?.id;
    if (!user || !userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    const serverUrl = getServerUrl();

    // Tạo socket connection
    const socket = io(serverUrl, {
      auth: {
        token: token
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    // Connection events
    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    // Listen for new notifications
    socket.on('new_notification', (notification) => {
      if (callbacksRef.current.onNotification) {
        callbacksRef.current.onNotification(notification);
      }
    });

    // Listen for unread count updates
    socket.on('unread_count_update', (data) => {
      if (callbacksRef.current.onUnreadCountUpdate) {
        callbacksRef.current.onUnreadCountUpdate(data.count);
      }
    });

    // Ping/pong for connection health
    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000); // Ping every 30 seconds

    // Cleanup on unmount
    return () => {
      clearInterval(pingInterval);
      if (socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user]);

  return socketRef.current;
};

