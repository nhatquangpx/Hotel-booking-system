const Notification = require("../../models/Notification");
const realtimeNotifier = require("./realtimeNotifier");
const { unreadFilterForUser } = require("./readState");
const {
  emitUnreadCountsForHotel,
  RECIPIENT_ROLE_HOTEL,
} = require("./inbox");

const sanitizeInput = (input, maxLength = 500) => {
  if (input === null || input === undefined) {
    return "N/A";
  }
  let sanitized = String(input);
  sanitized = sanitized.replace(/[<>\"'`{}[\]]/g, "");
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, "");
  if (sanitized.length > maxLength) {
    sanitized = `${sanitized.substring(0, maxLength)}...`;
  }
  return sanitized.trim() || "N/A";
};

const sanitizeIP = (ip) => {
  if (!ip || typeof ip !== "string") {
    return "N/A";
  }
  const ipRegex = /^([0-9]{1,3}\.){3}[0-9]{1,3}$|^([0-9a-fA-F]{0,4}:){2,7}[0-9a-fA-F]{0,4}$/;
  const sanitized = ip.trim();
  if (ipRegex.test(sanitized) && sanitized.length <= 45) {
    return sanitized;
  }
  return sanitizeInput(ip, 45);
};

const sanitizeError = (error) => {
  if (!error) return "N/A";
  const errorMessage = error instanceof Error ? error.message : String(error);
  return sanitizeInput(errorMessage, 200);
};

/** Thông báo cá nhân (guest, admin). */
const createNotification = async (
  recipientId,
  recipientRole,
  type,
  title,
  message,
  relatedId = null,
  relatedModel = null
) => {
  try {
    const notification = new Notification({
      recipient: recipientId,
      recipientRole,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      readBy: [],
    });

    await notification.save();

    try {
      realtimeNotifier.emitUserNotification(
        recipientId,
        recipientRole,
        notification.toObject()
      );

      const unreadCount = await Notification.countDocuments({
        recipient: recipientId,
        recipientRole,
        ...unreadFilterForUser(recipientId),
      });
      realtimeNotifier.emitUserUnreadCount(recipientId, recipientRole, unreadCount);
    } catch (socketError) {
      console.error("Lỗi khi emit notification realtime:", socketError);
    }

    return notification;
  } catch (error) {
    console.error(`Lỗi khi tạo thông báo ${type} cho ${recipientRole} ${recipientId}:`, error);
    return null;
  }
};

/** Thông báo vận hành — một bản ghi / khách sạn (owner + staff). */
const createHotelNotification = async (
  hotelId,
  type,
  title,
  message,
  relatedId = null,
  relatedModel = null
) => {
  try {
    const notification = new Notification({
      recipientRole: RECIPIENT_ROLE_HOTEL,
      hotel: hotelId,
      type,
      title,
      message,
      relatedId,
      relatedModel,
      readBy: [],
    });

    await notification.save();

    try {
      realtimeNotifier.emitHotelNotification(hotelId, notification.toObject());
      await emitUnreadCountsForHotel(hotelId);
    } catch (socketError) {
      console.error("Lỗi khi emit thông báo khách sạn realtime:", socketError);
    }

    return notification;
  } catch (error) {
    console.error(`Lỗi khi tạo thông báo ${type} cho hotel ${hotelId}:`, error);
    return null;
  }
};

module.exports = {
  createNotification,
  createHotelNotification,
  sanitizeInput,
  sanitizeIP,
  sanitizeError,
};
