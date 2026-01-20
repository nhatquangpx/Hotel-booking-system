const Notification = require("../../models/Notification");
const { emitNotification, emitUnreadCount } = require("../../socket/socketServer");

/**
 * Sanitize string input to prevent injection and limit length
 * Removes special characters that could be used for injection
 * Limits length to prevent DoS via very long messages
 * @param {String|Number|null|undefined} input - Input to sanitize
 * @param {Number} maxLength - Maximum allowed length (default: 500)
 * @returns {String} Sanitized string
 */
const sanitizeInput = (input, maxLength = 500) => {
  if (input === null || input === undefined) {
    return 'N/A';
  }
  
  // Convert to string
  let sanitized = String(input);
  
  // Remove or escape potentially dangerous characters
  // Keep alphanumeric, Vietnamese characters, spaces, common punctuation
  sanitized = sanitized.replace(/[<>\"'`{}[\]]/g, ''); // Remove brackets, quotes, backticks
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, ''); // Remove control characters
  
  // Limit length to prevent DoS
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength) + '...';
  }
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized || 'N/A';
};

/**
 * Sanitize IP address (only allow valid IP format)
 * @param {String} ip - IP address to sanitize
 * @returns {String} Sanitized IP or 'N/A'
 */
const sanitizeIP = (ip) => {
  if (!ip || typeof ip !== 'string') {
    return 'N/A';
  }
  
  // Basic IP validation regex (IPv4 and IPv6)
  const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  const sanitized = ip.trim();
  
  if (ipRegex.test(sanitized) && sanitized.length <= 45) {
    return sanitized;
  }
  
  // If invalid, return sanitized version with limited length
  return sanitizeInput(ip, 45);
};

/**
 * Sanitize error message (more aggressive sanitization)
 * @param {String|Error} error - Error object or message
 * @returns {String} Sanitized error message
 */
const sanitizeError = (error) => {
  if (!error) return 'N/A';
  
  // If it's an Error object, get the message
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  // More aggressive sanitization for error messages
  return sanitizeInput(errorMessage, 200);
};

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
  createNotification,
  sanitizeInput,
  sanitizeIP,
  sanitizeError
};
