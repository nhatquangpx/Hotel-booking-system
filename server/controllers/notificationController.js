const Notification = require("../models/Notification");
const { checkNoShowBookings } = require("../services/notifications");
const { emitUnreadCount } = require("../socket/socketServer");
const inbox = require("../services/notifications/inbox");

exports.getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { userId, hotelIds, query } = await inbox.getInboxContext(req);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip(skip)
      .lean();

    const total = await Notification.countDocuments(query);
    const unreadCount = await inbox.countUnreadForUser(userId, req.user.role, hotelIds);

    res.status(200).json({
      notifications,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
      unreadCount,
    });
  } catch (error) {
    console.error("Lỗi khi lấy thông báo:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông báo", error: error.message });
  }
};

exports.getUnreadCount = async (req, res) => {
  try {
    const { userId, hotelIds } = await inbox.getInboxContext(req);
    const unreadCount = await inbox.countUnreadForUser(userId, req.user.role, hotelIds);
    res.status(200).json({ unreadCount });
  } catch (error) {
    console.error("Lỗi khi lấy số lượng thông báo chưa đọc:", error);
    res.status(500).json({
      message: "Lỗi khi lấy số lượng thông báo chưa đọc",
      error: error.message,
    });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, userRole, hotelIds } = await inbox.getInboxContext(req);

    const notification = await inbox.findInboxNotification(id, req);
    if (!notification) {
      return res.status(404).json({ message: "Không tìm thấy thông báo" });
    }

    await inbox.markNotificationReadByUser(notification, userId);
    await inbox.syncUnreadCountAfterRead(
      userId,
      userRole,
      hotelIds,
      notification,
      emitUnreadCount
    );

    const updated = await Notification.findById(id).lean();
    res.status(200).json({
      message: "Đã đánh dấu thông báo là đã đọc",
      notification: updated,
    });
  } catch (error) {
    console.error("Lỗi khi đánh dấu thông báo:", error);
    res.status(500).json({ message: "Lỗi khi đánh dấu thông báo", error: error.message });
  }
};

exports.markAllAsRead = async (req, res) => {
  try {
    const { userId, userRole, hotelIds } = await inbox.getInboxContext(req);

    await inbox.markAllInboxRead(userId, userRole, hotelIds);

    if (hotelIds.length > 0) {
      await inbox.emitUnreadCountsForHotels(hotelIds, emitUnreadCount);
    }
    const unreadCount = await inbox.countUnreadForUser(userId, userRole, hotelIds);
    emitUnreadCount(userId, userRole, unreadCount);

    res.status(200).json({ message: "Đã đánh dấu tất cả thông báo là đã đọc" });
  } catch (error) {
    console.error("Lỗi khi đánh dấu tất cả thông báo:", error);
    res.status(500).json({
      message: "Lỗi khi đánh dấu tất cả thông báo",
      error: error.message,
    });
  }
};

exports.loadMoreNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const { query } = await inbox.getInboxContext(req);

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit, 10))
      .skip(skip)
      .lean();

    const total = await Notification.countDocuments(query);
    const hasMore = skip + notifications.length < total;

    res.status(200).json({
      notifications,
      hasMore,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    });
  } catch (error) {
    console.error("Lỗi khi tải thêm thông báo:", error);
    res.status(500).json({ message: "Lỗi khi tải thêm thông báo", error: error.message });
  }
};

exports.checkNoShowBookings = async (req, res) => {
  try {
    if (req.user.role !== "owner") {
      return res.status(403).json({ message: "Chỉ chủ khách sạn mới có quyền thực hiện thao tác này" });
    }

    const result = await checkNoShowBookings();
    res.status(200).json({
      message: "Đã kiểm tra no-show bookings",
      ...result,
    });
  } catch (error) {
    console.error("Lỗi khi kiểm tra no-show bookings:", error);
    res.status(500).json({
      message: "Lỗi khi kiểm tra no-show bookings",
      error: error.message,
    });
  }
};
