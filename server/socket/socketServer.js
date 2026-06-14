const { Server } = require("socket.io");
const socketAuth = require("../services/auth/socketAuthService");
const { getTokenFromSocketHandshake } = require("../lib/auth/authCookie");

let io = null;

const initializeSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin(origin, callback) {
        const allowedOrigins = [
          "http://localhost:3000",
          "http://localhost:5173",
          process.env.FRONTEND_URL,
        ].filter(Boolean);

        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        if (origin.endsWith(".vercel.app")) return callback(null, true);
        if (origin.startsWith("http://localhost:")) return callback(null, true);
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST"],
    },
    transports: ["websocket", "polling"],
    allowEIO3: true,
  });

  io.use(async (socket, next) => {
    try {
      const token = getTokenFromSocketHandshake(socket);
      const auth = await socketAuth.verifySocketToken(token);
      socket.userId = auth.userId;
      socket.userRole = auth.userRole;
      socket.user = auth.user;
      next();
    } catch (error) {
      console.error("Socket authentication error:", error.message);
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const room = `${socket.userRole}:${socket.userId}`;
    socket.join(room);

    try {
      const hotelRoomIds = await socketAuth.getSocketHotelRoomIds(
        socket.userId,
        socket.userRole
      );
      for (const hotelId of hotelRoomIds) {
        socket.join(`hotel:${hotelId}`);
      }
    } catch (err) {
      console.error("Lỗi khi join socket room khách sạn:", err.message);
    }

    socket.on("ping", () => {
      socket.emit("pong");
    });
  });

  return io;
};

const emitNotification = (recipientId, recipientRole, notification) => {
  if (!io) {
    console.warn("Socket.io not initialized. Cannot emit notification.");
    return;
  }
  io.to(`${recipientRole}:${recipientId}`).emit("new_notification", notification);
};

const emitUnreadCount = (recipientId, recipientRole, count) => {
  if (!io) {
    console.warn("Socket.io not initialized. Cannot emit unread count.");
    return;
  }
  io.to(`${recipientRole}:${recipientId}`).emit("unread_count_update", { count });
};

const emitHotelNotification = (hotelId, notification) => {
  if (!io) {
    console.warn("Socket.io not initialized. Cannot emit hotel notification.");
    return;
  }
  io.to(`hotel:${hotelId}`).emit("new_notification", notification);
};

const getIO = () => {
  if (!io) throw new Error("Socket.io not initialized. Call initializeSocket() first.");
  return io;
};

module.exports = {
  initializeSocket,
  emitNotification,
  emitHotelNotification,
  emitUnreadCount,
  getIO,
};
