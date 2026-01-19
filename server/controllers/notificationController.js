const Notification = require("../models/Notification");
const { checkNoShowBookings } = require("../services/notifications");
const Hotel = require("../models/Hotel");
const { emitUnreadCount } = require("../socket/socketServer");

/**
 * Base notification controller - Generic functions that work for all roles
 * Role-specific logic can be added in role-specific controllers if needed
 */

/**
 * Get recipient ID and role from request
 * This helper ensures we get the right user ID and role from the authenticated user
 */
const getRecipientInfo = (req) => {
  return {
    recipientId: req.user.id,
    recipientRole: req.user.role
  };
};

/**
 * Build query for notifications based on recipient
 */
const buildNotificationQuery = (recipientId, recipientRole, additionalFilters = {}) => {
  return {
    recipient: recipientId,
    recipientRole: recipientRole,
    ...additionalFilters
  };
};

// Get notifications for authenticated user with pagination
exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const { recipientId, recipientRole } = getRecipientInfo(req);

    const query = buildNotificationQuery(recipientId, recipientRole);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({ 
      ...query,
      isRead: false 
    });

    res.status(200).json({
      notifications,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      },
      unreadCount
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông báo:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy thông báo", 
      error: error.message 
    });
  }
};

// Get unread notifications count
exports.getUnreadCount = async (req, res) => {
  try {
    const { recipientId, recipientRole } = getRecipientInfo(req);
    const query = buildNotificationQuery(recipientId, recipientRole, { isRead: false });

    const unreadCount = await Notification.countDocuments(query);

    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Lỗi khi lấy số lượng thông báo chưa đọc:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy số lượng thông báo chưa đọc", 
      error: error.message 
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { recipientId, recipientRole } = getRecipientInfo(req);

    const notification = await Notification.findOne({
      _id: id,
      recipient: recipientId,
      recipientRole: recipientRole
    });

    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    // Emit unread count update via Socket.io
    try {
      const unreadCount = await Notification.countDocuments({
        recipient: recipientId,
        recipientRole: recipientRole,
        isRead: false
      });
      emitUnreadCount(recipientId.toString(), recipientRole, unreadCount);
    } catch (socketError) {
      console.error('Lỗi khi emit unread count update:', socketError);
    }

    res.status(200).json({ 
      message: "Đã đánh dấu thông báo là đã đọc",
      notification 
    });
  } catch (error) {
    console.error("Lỗi khi đánh dấu thông báo:", error);
    res.status(500).json({ 
      message: "Lỗi khi đánh dấu thông báo", 
      error: error.message 
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { recipientId, recipientRole } = getRecipientInfo(req);
    const query = buildNotificationQuery(recipientId, recipientRole, { isRead: false });

    await Notification.updateMany(
      query,
      { 
        isRead: true, 
        readAt: new Date() 
      }
    );

    // Emit unread count update via Socket.io (should be 0 after marking all as read)
    try {
      emitUnreadCount(recipientId.toString(), recipientRole, 0);
    } catch (socketError) {
      console.error('Lỗi khi emit unread count update:', socketError);
    }

    res.status(200).json({ message: "Đã đánh dấu tất cả thông báo là đã đọc" });
  } catch (error) {
    console.error("Lỗi khi đánh dấu tất cả thông báo:", error);
    res.status(500).json({ 
      message: "Lỗi khi đánh dấu tất cả thông báo", 
      error: error.message 
    });
  }
};

// Load more notifications (for pagination)
exports.loadMoreNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const { recipientId, recipientRole } = getRecipientInfo(req);

    const query = buildNotificationQuery(recipientId, recipientRole);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip)
      .lean();

    const total = await Notification.countDocuments(query);
    const hasMore = skip + notifications.length < total;

    res.status(200).json({
      notifications,
      hasMore,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    console.error("Lỗi khi tải thêm thông báo:", error);
    res.status(500).json({ 
      message: "Lỗi khi tải thêm thông báo", 
      error: error.message 
    });
  }
};

// Check and create no-show notifications (Owner-specific, but kept here for now)
// Can be moved to owner-specific controller if needed
exports.checkNoShowBookings = async (req, res) => {
  try {
    // Verify user is owner
    if (req.user.role !== 'owner') {
      return res.status(403).json({ message: "Chỉ chủ khách sạn mới có quyền thực hiện thao tác này" });
    }

    const result = await checkNoShowBookings();
    res.status(200).json({ 
      message: "Đã kiểm tra no-show bookings",
      ...result
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra no-show bookings:", error);
    res.status(500).json({ 
      message: "Lỗi khi kiểm tra no-show bookings", 
      error: error.message 
    });
  }
};
