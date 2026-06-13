const Notification = require("../../models/Notification");
const { checkNoShowBookings } = require("./owner");
const realtimeNotifier = require("./realtimeNotifier");
const inbox = require("./inbox");
const { ServiceError } = require("../../lib/http/serviceError");

const emitUnread = realtimeNotifier.emitUserUnreadCount.bind(realtimeNotifier);

async function getNotifications({ req, page = 1, limit = 10 }) {
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const { userId, hotelIds, query } = await inbox.getInboxContext(req);

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .skip(skip)
    .lean({ defaults: true });

  const total = await Notification.countDocuments(query);
  const unreadCount = await inbox.countUnreadForUser(userId, req.user.role, hotelIds);

  return {
    status: 200,
    body: {
      notifications,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
      unreadCount,
    },
  };
}

async function getUnreadCount({ req }) {
  const { userId, hotelIds } = await inbox.getInboxContext(req);
  const unreadCount = await inbox.countUnreadForUser(userId, req.user.role, hotelIds);
  return { status: 200, body: { unreadCount } };
}

async function markAsRead({ req, id }) {
  const { userId, userRole, hotelIds } = await inbox.getInboxContext(req);
  const notification = await inbox.findInboxNotification(id, req);
  if (!notification) throw new ServiceError(404, "Không tìm thấy thông báo");

  await inbox.markNotificationReadByUser(notification, userId);
  await inbox.syncUnreadCountAfterRead(userId, userRole, hotelIds, notification, emitUnread);

  const updated = await Notification.findById(id).lean({ defaults: true });
  return {
    status: 200,
    body: { message: "Đã đánh dấu thông báo là đã đọc", notification: updated },
  };
}

async function markAllAsRead({ req }) {
  const { userId, userRole, hotelIds } = await inbox.getInboxContext(req);
  await inbox.markAllInboxRead(userId, userRole, hotelIds);

  if (hotelIds.length > 0) {
    await inbox.emitUnreadCountsForHotels(hotelIds, emitUnread);
  }
  const unreadCount = await inbox.countUnreadForUser(userId, userRole, hotelIds);
  emitUnread(userId, userRole, unreadCount);

  return { status: 200, body: { message: "Đã đánh dấu tất cả thông báo là đã đọc" } };
}

async function loadMoreNotifications({ req, page = 1, limit = 10 }) {
  const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const { query } = await inbox.getInboxContext(req);

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit, 10))
    .skip(skip)
    .lean({ defaults: true });

  const total = await Notification.countDocuments(query);
  const hasMore = skip + notifications.length < total;

  return {
    status: 200,
    body: {
      notifications,
      hasMore,
      pagination: {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        total,
        totalPages: Math.ceil(total / parseInt(limit, 10)),
      },
    },
  };
}

async function runNoShowCheck({ userRole }) {
  if (userRole !== "owner") {
    throw new ServiceError(403, "Chỉ chủ khách sạn mới có quyền thực hiện thao tác này");
  }
  const result = await checkNoShowBookings();
  return { status: 200, body: { message: "Đã kiểm tra no-show bookings", ...result } };
}

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  loadMoreNotifications,
  runNoShowCheck,
};
