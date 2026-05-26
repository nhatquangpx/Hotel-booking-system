const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Hotel = require('../models/Hotel');
const { findHotelByStaffId } = require('../utils/staffHotel');
const { getTokenFromSocketHandshake } = require('../utils/authCookie');

/**
 * Socket.io Server Setup
 * Handles realtime notifications for all roles (owner, admin, guest)
 */

let io = null;

/**
 * Initialize Socket.io server
 * @param {http.Server} server - HTTP server instance
 */
const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: function (origin, callback) {
        // Cho phép localhost và production URLs
        const allowedOrigins = [
          'http://localhost:3000',
          'http://localhost:5173', // Vite default port
          process.env.FRONTEND_URL,
        ].filter(Boolean);

        // Cho phép requests không có origin (mobile apps, Postman, etc.)
        if (!origin) {
          return callback(null, true);
        }

        // Cho phép localhost và production URL từ env var
        if (allowedOrigins.indexOf(origin) !== -1) {
          return callback(null, true);
        }

        // Cho phép tất cả Vercel URLs
        if (origin.endsWith('.vercel.app')) {
          return callback(null, true);
        }

        // Allow all localhost ports for development
        if (origin.startsWith('http://localhost:')) {
          return callback(null, true);
        }

        callback(new Error('Not allowed by CORS'));
      },
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true, // Allow Engine.IO v3 clients
  });

  // Socket authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = getTokenFromSocketHandshake(socket);
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Get user from database to ensure user still exists
      const user = await User.findById(decoded.id).select('_id role name email');
      if (!user) {
        return next(new Error('Authentication error: User not found'));
      }

      // Attach user info to socket
      socket.userId = user._id.toString();
      socket.userRole = user.role;
      socket.user = user;

      next();
    } catch (error) {
      console.error('Socket authentication error:', error.message);
      next(new Error('Authentication error: Invalid token'));
    }
  });

  // Handle client connections
  io.on('connection', async (socket) => {
    // Join room based on user role and ID
    // Format: role:userId (e.g., "owner:507f1f77bcf86cd799439011")
    const room = `${socket.userRole}:${socket.userId}`;
    socket.join(room);

    // Phòng khách sạn — owner + staff cùng nhận realtime
    try {
      if (socket.userRole === 'owner') {
        const hotels = await Hotel.find({ ownerId: socket.userId }).select('_id').lean();
        for (const h of hotels) {
          socket.join(`hotel:${h._id}`);
        }
      } else if (socket.userRole === 'staff') {
        const hotel = await findHotelByStaffId(socket.userId);
        if (hotel?._id) {
          socket.join(`hotel:${hotel._id}`);
        }
      }
    } catch (err) {
      console.error('Lỗi khi join socket room khách sạn:', err.message);
    }

    // Handle ping/pong for connection health check
    socket.on('ping', () => {
      socket.emit('pong');
    });
  });

  return io;
};

/**
 * Emit notification to specific user
 * @param {String} recipientId - User ID to send notification to
 * @param {String} recipientRole - User role (owner, admin, guest)
 * @param {Object} notification - Notification object
 */
const emitNotification = (recipientId, recipientRole, notification) => {
  if (!io) {
    console.warn('Socket.io not initialized. Cannot emit notification.');
    return;
  }

  const room = `${recipientRole}:${recipientId}`;
  io.to(room).emit('new_notification', notification);
};

/**
 * Emit unread count update to specific user
 * @param {String} recipientId - User ID
 * @param {String} recipientRole - User role
 * @param {Number} count - Unread count
 */
const emitUnreadCount = (recipientId, recipientRole, count) => {
  if (!io) {
    console.warn('Socket.io not initialized. Cannot emit unread count.');
    return;
  }

  const room = `${recipientRole}:${recipientId}`;
  io.to(room).emit('unread_count_update', { count });
};

/**
 * Emit notification to all owner/staff subscribed to hotel room
 */
const emitHotelNotification = (hotelId, notification) => {
  if (!io) {
    console.warn('Socket.io not initialized. Cannot emit hotel notification.');
    return;
  }
  io.to(`hotel:${hotelId}`).emit('new_notification', notification);
};

/**
 * Get Socket.io instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized. Call initializeSocket() first.');
  }
  return io;
};

module.exports = {
  initializeSocket,
  emitNotification,
  emitHotelNotification,
  emitUnreadCount,
  getIO,
};

