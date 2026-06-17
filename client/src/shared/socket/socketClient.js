import { io } from 'socket.io-client';

let socket = null;
let activeUserId = null;
let pingIntervalId = null;

const listeners = {
  notification: new Set(),
  unread: new Set(),
};

function getServerUrl() {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl) {
    return envUrl.replace('/api', '');
  }
  return 'http://localhost:8001';
}

function notifyAll(set, ...args) {
  set.forEach((fn) => {
    try {
      fn(...args);
    } catch (error) {
      console.error('Socket listener error:', error);
    }
  });
}

function clearPingInterval() {
  if (pingIntervalId != null) {
    clearInterval(pingIntervalId);
    pingIntervalId = null;
  }
}

function wireSocket(sock) {
  sock.off('connect_error');
  sock.off('new_notification');
  sock.off('unread_count_update');

  sock.on('connect_error', (error) => {
    console.error('Socket connection error:', error.message);
  });

  sock.on('new_notification', (notification) => {
    notifyAll(listeners.notification, notification);
  });

  sock.on('unread_count_update', (data) => {
    notifyAll(listeners.unread, data?.count);
  });
}

export function subscribeSocketNotifications(callback) {
  listeners.notification.add(callback);
  return () => listeners.notification.delete(callback);
}

export function subscribeSocketUnreadCount(callback) {
  listeners.unread.add(callback);
  return () => listeners.unread.delete(callback);
}

export function connectSocket(userId) {
  if (!userId) return null;

  if (socket && activeUserId === userId) {
    return socket;
  }

  if (socket) {
    clearPingInterval();
    socket.disconnect();
    socket = null;
  }

  activeUserId = userId;
  socket = io(getServerUrl(), {
    withCredentials: true,
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionAttempts: 5,
  });

  wireSocket(socket);

  clearPingInterval();
  pingIntervalId = setInterval(() => {
    if (socket?.connected) {
      socket.emit('ping');
    }
  }, 30000);

  return socket;
}

export function disconnectSocketIfIdle() {
  if (listeners.notification.size > 0 || listeners.unread.size > 0) {
    return;
  }

  clearPingInterval();
  if (socket) {
    socket.disconnect();
    socket = null;
  }
  activeUserId = null;
}
