const {
  emitNotification,
  emitUnreadCount,
  emitHotelNotification: socketEmitHotelNotification,
} = require("../../socket/socketServer");

/** Adapter tách transport Socket.IO khỏi logic lưu notification. */
const realtimeNotifier = {
  emitUserNotification(recipientId, recipientRole, notification) {
    emitNotification(String(recipientId), recipientRole, notification);
  },

  emitUserUnreadCount(recipientId, recipientRole, count) {
    emitUnreadCount(String(recipientId), recipientRole, count);
  },

  emitHotelNotification(hotelId, notification) {
    socketEmitHotelNotification(String(hotelId), notification);
  },
};

module.exports = realtimeNotifier;
