const Notification = require("../../models/Notification");
const Hotel = require("../../models/Hotel");
const realtimeNotifier = require("./realtimeNotifier");
const { toObjectId, unreadFilterForUser } = require("./readState");

const defaultEmitUnreadCount = realtimeNotifier.emitUserUnreadCount.bind(realtimeNotifier);

const RECIPIENT_ROLE_HOTEL = "hotel";
const HOTEL_TEAM_ROLES = ["owner", "staff"];

function isHotelTeamRole(role) {
  return HOTEL_TEAM_ROLES.includes(role);
}

function toUserIdString(userId) {
  return userId?.toString?.() || String(userId);
}

async function getHotelIdsForOwner(ownerId) {
  const hotels = await Hotel.find({ ownerId }).select("_id").lean();
  return hotels.map((h) => h._id);
}

async function resolveHotelIdsForUser(req) {
  if (req.user.role === "staff") {
    const hotelId = req.staffHotelId || req.hotel?._id;
    return hotelId ? [hotelId] : [];
  }
  if (req.user.role === "owner") {
    return getHotelIdsForOwner(req.user.id);
  }
  return [];
}

/** Owner/staff: chỉ thông báo recipientRole hotel. Guest/admin: inbox cá nhân. */
function buildInboxQuery(userId, userRole, hotelIds) {
  if (!isHotelTeamRole(userRole)) {
    return {
      recipient: toUserIdString(userId),
      recipientRole: userRole,
    };
  }

  if (!hotelIds.length) {
    return { recipientRole: RECIPIENT_ROLE_HOTEL, hotel: { $in: [] } };
  }

  return {
    recipientRole: RECIPIENT_ROLE_HOTEL,
    hotel: { $in: hotelIds },
  };
}

async function getInboxContext(req) {
  const userId = toUserIdString(req.user.id);
  const userRole = req.user.role;
  const hotelIds = await resolveHotelIdsForUser(req);
  return {
    userId,
    userRole,
    hotelIds,
    query: buildInboxQuery(userId, userRole, hotelIds),
  };
}

async function findInboxNotification(notificationId, req) {
  const { query } = await getInboxContext(req);
  return Notification.findOne({ _id: notificationId, ...query });
}

async function countUnreadForUser(userId, userRole, hotelIds = []) {
  const unread = unreadFilterForUser(userId);

  if (isHotelTeamRole(userRole)) {
    if (!hotelIds.length) return 0;
    return Notification.countDocuments({
      recipientRole: RECIPIENT_ROLE_HOTEL,
      hotel: { $in: hotelIds },
      ...unread,
    });
  }

  return Notification.countDocuments({
    recipient: toUserIdString(userId),
    recipientRole: userRole,
    ...unread,
  });
}

/**
 * Cập nhật badge realtime sau thay đổi thông báo của một KS.
 * Owner: tổng unread trên mọi KS họ sở hữu (không chỉ hotelId vừa đổi).
 * Staff: chỉ KS được gán.
 */
async function emitUnreadCountsForHotel(hotelId, emitUnreadCount = defaultEmitUnreadCount) {
  const hotel = await Hotel.findById(hotelId).select("ownerId staffIds").lean();
  if (!hotel) return;

  const tasks = [];
  if (hotel.ownerId) {
    const ownerId = hotel.ownerId.toString();
    const ownerHotelIds = await getHotelIdsForOwner(hotel.ownerId);
    tasks.push(
      countUnreadForUser(ownerId, "owner", ownerHotelIds).then((count) =>
        emitUnreadCount(ownerId, "owner", count)
      )
    );
  }
  for (const staffId of hotel.staffIds || []) {
    const sid = staffId.toString();
    tasks.push(
      countUnreadForUser(sid, "staff", [hotelId]).then((count) =>
        emitUnreadCount(sid, "staff", count)
      )
    );
  }
  await Promise.all(tasks);
}

/** Cập nhật badge cho mọi KS trong danh sách; owner mỗi người chỉ emit một lần. */
async function emitUnreadCountsForHotels(hotelIds, emitUnreadCount = defaultEmitUnreadCount) {
  if (!hotelIds?.length) return;

  const hotels = await Hotel.find({ _id: { $in: hotelIds } })
    .select("ownerId staffIds")
    .lean();
  const tasks = [];
  const ownersEmitted = new Set();

  for (const hotel of hotels) {
    if (hotel.ownerId) {
      const ownerId = hotel.ownerId.toString();
      if (!ownersEmitted.has(ownerId)) {
        ownersEmitted.add(ownerId);
        const ownerHotelIds = await getHotelIdsForOwner(hotel.ownerId);
        tasks.push(
          countUnreadForUser(ownerId, "owner", ownerHotelIds).then((count) =>
            emitUnreadCount(ownerId, "owner", count)
          )
        );
      }
    }
    for (const staffId of hotel.staffIds || []) {
      const sid = staffId.toString();
      tasks.push(
        countUnreadForUser(sid, "staff", [hotel._id]).then((count) =>
          emitUnreadCount(sid, "staff", count)
        )
      );
    }
  }
  await Promise.all(tasks);
}

async function markNotificationReadByUser(notification, userId) {
  const uid = toObjectId(userId);
  await Notification.updateOne(
    { _id: notification._id },
    { $addToSet: { readBy: uid } }
  );
}

async function markAllInboxRead(userId, userRole, hotelIds) {
  const uid = toObjectId(userId);
  const query = buildInboxQuery(userId, userRole, hotelIds);
  await Notification.updateMany(
    { ...query, ...unreadFilterForUser(userId) },
    { $addToSet: { readBy: uid } }
  );
}

async function syncUnreadCountAfterRead(
  userId,
  userRole,
  hotelIds,
  notification,
  emitUnreadCount = defaultEmitUnreadCount
) {
  if (notification?.recipientRole === RECIPIENT_ROLE_HOTEL && notification.hotel) {
    await emitUnreadCountsForHotel(notification.hotel, emitUnreadCount);
    return;
  }
  const count = await countUnreadForUser(userId, userRole, hotelIds);
  emitUnreadCount(userId, userRole, count);
}

module.exports = {
  RECIPIENT_ROLE_HOTEL,
  HOTEL_TEAM_ROLES,
  isHotelTeamRole,
  resolveHotelIdsForUser,
  buildInboxQuery,
  getInboxContext,
  findInboxNotification,
  countUnreadForUser,
  emitUnreadCountsForHotel,
  emitUnreadCountsForHotels,
  markNotificationReadByUser,
  markAllInboxRead,
  syncUnreadCountAfterRead,
};
