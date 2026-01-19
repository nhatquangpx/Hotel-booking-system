const Notification = require("../../models/Notification");
const { emitNotification, emitUnreadCount } = require("../../socket/socketServer");

/**
 * Core Notification Service
 * Generic helper function to create notifications for all roles
 * 
 * @param {String} recipientId - Recipient user ID
 * @param {String} recipientRole - Recipient role (owner, admin, guest)
 * @param {String} type - Notification type
 * @param {String} title - Notification title
 * @param {String} message - Notification message
 * @param {String} relatedId - Related entity ID (booking, review, etc.)
 * @param {String} relatedModel - Related model name (Booking, Review, Hotel, Room)
 * @returns {Promise<Notification|null>} Created notification or null on error
 */
const createNotification = async (recipientId, recipientRole, type, title, message, relatedId = null, relatedModel = null) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      recipientRole: recipientRole,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      isRead: false
    });

    await notification.save();

    // Emit realtime notification via Socket.io
    try {
      const notificationData = {
        _id: notification._id,
        recipient: notification.recipient,
        recipientRole: notification.recipientRole,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        relatedId: notification.relatedId,
        relatedModel: notification.relatedModel,
        isRead: notification.isRead,
        createdAt: notification.createdAt,
        updatedAt: notification.updatedAt
      };
      emitNotification(recipientId.toString(), recipientRole, notificationData);

      // Emit unread count update
      const unreadCount = await Notification.countDocuments({
        recipient: recipientId,
        recipientRole: recipientRole,
        isRead: false
      });
      emitUnreadCount(recipientId.toString(), recipientRole, unreadCount);
    } catch (socketError) {
      // Log error but don't fail the notification creation
      console.error('Lỗi khi emit notification realtime:', socketError);
    }

    return notification;
  } catch (error) {
    console.error(`Lỗi khi tạo thông báo ${type} cho ${recipientRole} ${recipientId}:`, error);
    return null;
  }
};

module.exports = {
  createNotification
};
