import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './useAuth';

/**
 * Custom hook để quản lý Socket.io connection
 * Cookie HttpOnly được gửi kèm handshake (withCredentials)
 */
export const useSocket = (onNotification, onUnreadCountUpdate) => {
  const { user, isAuthenticated } = useAuth();
  const socketRef = useRef(null);
  const callbacksRef = useRef({ onNotification, onUnreadCountUpdate });

  const getServerUrl = () => {
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) {
      const baseUrl = envUrl.replace('/api', '');
      return baseUrl;
    }
    return 'http://localhost:8001';
  };

  useEffect(() => {
    callbacksRef.current = { onNotification, onUnreadCountUpdate };
  }, [onNotification, onUnreadCountUpdate]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    if (!isAuthenticated || !user || !userId) {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      return;
    }

    const serverUrl = getServerUrl();

    const socket = io(serverUrl, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
    });

    socket.on('new_notification', (notification) => {
      if (callbacksRef.current.onNotification) {
        callbacksRef.current.onNotification(notification);
      }
    });

    socket.on('unread_count_update', (data) => {
      if (callbacksRef.current.onUnreadCountUpdate) {
        callbacksRef.current.onUnreadCountUpdate(data.count);
      }
    });

    const pingInterval = setInterval(() => {
      if (socket.connected) {
        socket.emit('ping');
      }
    }, 30000);

    return () => {
      clearInterval(pingInterval);
      if (socket.connected) {
        socket.disconnect();
      }
      socketRef.current = null;
    };
  }, [user, isAuthenticated]);

  return socketRef.current;
};
