const Hotel = require("../../models/Hotel");
const Room = require("../../models/Room");
const Booking = require("../../models/Booking");
const Review = require("../../models/Review");
const {
  getRoomMapDisplayStatus,
  roomNeedsDashboardAttention,
  roomAttentionPriority,
} = require("../../services/dashboards/roomMapDisplay");
const { getTodayDateRange } = require("./core");

/** Chỉ field cần cho task dashboard — tránh load toàn bộ booking (refund, bank, …). */
const DASHBOARD_BOOKING_TASK_SELECT = "_id guest room checkedInAt checkedOutAt";

/** Gom tên thiết bị cùng phòng: «A, B» hoặc «A, B +2 mục». */
function formatEquipmentNamesList(names) {
  const list = names.map((n) => String(n || "").trim()).filter(Boolean);
  if (list.length === 0) return "Thiết bị";
  if (list.length === 1) return list[0];
  if (list.length === 2) return list.join(", ");
  return `${list.slice(0, 2).join(", ")} +${list.length - 2} mục`;
}

function mapRoomSnapshot(room) {
  const display = getRoomMapDisplayStatus(room);

  return {
    id: room._id.toString(),
    number: room.roomNumber != null ? String(room.roomNumber) : "N/A",
    bookingStatus: display.bookingStatus,
    roomStatus: display.roomStatus,
    displayColor: display.displayColor,
    label: display.label,
    secondaryLabel: display.secondaryLabel,
    linkTo: "/staff/rooms",
  };
}

/**
 * Dashboard staff — thống kê + 4 panel (một khách sạn đã gán).
 * @param {import('mongoose').Types.ObjectId|string} hotelId — từ req.staffHotelId (attachStaffHotel)
 */
async function getStaffDashboard(hotelId) {
  const { today, tomorrow } = getTodayDateRange();

  const hotel = await Hotel.findById(hotelId).select("policies name").lean();
  const policies = hotel?.policies || {};
  const checkInTimeDefault = policies.checkInTime || "14:00";
  const checkOutTimeDefault = policies.checkOutTime || "12:00";

  const [
    rooms,
    reviewsAwaitingReply,
    checkInToday,
    checkOutToday,
    todayCheckIns,
    todayCheckOuts,
    pendingReviews,
  ] = await Promise.all([
    Room.find({ hotelId }).select("roomNumber roomStatus bookingStatus +roomEquipment").lean(),
    Review.countDocuments({
      hotel: hotelId,
      $or: [{ ownerResponse: { $exists: false } }, { ownerResponse: null }, { ownerResponse: "" }],
    }),
    Booking.countDocuments({
      hotel: hotelId,
      paymentStatus: "paid",
      checkInDate: { $gte: today, $lt: tomorrow },
    }),
    Booking.countDocuments({
      hotel: hotelId,
      paymentStatus: "paid",
      checkOutDate: { $gte: today, $lt: tomorrow },
    }),
    Booking.find({
      hotel: hotelId,
      paymentStatus: "paid",
      checkInDate: { $gte: today, $lt: tomorrow },
    })
      .select(DASHBOARD_BOOKING_TASK_SELECT)
      .populate("room", "roomNumber")
      .populate("guest", "name")
      .lean(),
    Booking.find({
      hotel: hotelId,
      paymentStatus: "paid",
      checkOutDate: { $gte: today, $lt: tomorrow },
    })
      .select(DASHBOARD_BOOKING_TASK_SELECT)
      .populate("room", "roomNumber")
      .populate("guest", "name")
      .lean(),
    Review.find({
      hotel: hotelId,
      $or: [{ ownerResponse: { $exists: false } }, { ownerResponse: null }, { ownerResponse: "" }],
    })
      .populate("guest", "name")
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(
    (r) => r.bookingStatus === "empty" && r.roomStatus === "active"
  ).length;

  /** Đếm thiết bị — khớp trang /staff/equipment (broken = chờ xử lý) */
  const equipmentPanelItems = [];
  let equipmentBrokenCount = 0;
  let equipmentUnderRepairCount = 0;

  for (const room of rooms) {
    const roomNo = room.roomNumber != null ? String(room.roomNumber) : "N/A";
    for (const eq of room.roomEquipment || []) {
      if (eq.status !== "broken" && eq.status !== "under_repair") continue;
      const eqId = eq._id != null ? String(eq._id) : "";
      if (!eqId) continue;

      if (eq.status === "broken") {
        equipmentBrokenCount += 1;
      } else {
        equipmentUnderRepairCount += 1;
      }

      equipmentPanelItems.push({
        id: `equipment-${room._id}-${eqId}`,
        name: String(eq.name || "Thiết bị").trim() || "Thiết bị",
        room: roomNo,
        issue: eq.status === "broken" ? "Hỏng" : "Đang sửa chữa",
        status: eq.status === "broken" ? "pending" : "progress",
        statusLabel: eq.status === "broken" ? "Chờ xử lý" : "Đang sửa",
        sortOrder: eq.status === "broken" ? 0 : 1,
        linkTo: "/staff/equipment",
      });
    }
  }

  equipmentPanelItems.sort((a, b) => a.sortOrder - b.sortOrder || a.room.localeCompare(b.room));
  const equipment = equipmentPanelItems.map(({ sortOrder, ...item }) => item);
  const equipmentAttentionCount = equipmentBrokenCount + equipmentUnderRepairCount;

  const tasks = [];

  todayCheckIns.forEach((booking) => {
    tasks.push({
      id: `checkin-${booking._id}`,
      type: "checkin",
      guest: booking.guest?.name || "Khách hàng",
      room: booking.room?.roomNumber != null ? String(booking.room.roomNumber) : "N/A",
      time: checkInTimeDefault,
      done: Boolean(booking.checkedInAt),
      linkTo: `/staff/bookings?filter=action&bookingId=${booking._id}`,
    });
  });

  todayCheckOuts.forEach((booking) => {
    tasks.push({
      id: `checkout-${booking._id}`,
      type: "checkout",
      guest: booking.guest?.name || "Khách hàng",
      room: booking.room?.roomNumber != null ? String(booking.room.roomNumber) : "N/A",
      time: checkOutTimeDefault,
      done: Boolean(booking.checkedOutAt),
      linkTo: `/staff/bookings?filter=action&bookingId=${booking._id}`,
    });
  });

  for (const room of rooms) {
    if (room.roomStatus === "maintenance") {
      const roomNo = room.roomNumber != null ? String(room.roomNumber) : "N/A";
      tasks.push({
        id: `maintenance-${room._id}`,
        type: "maintenance",
        text: `Sửa chữa phòng ${roomNo}`,
        urgent: true,
        done: false,
        linkTo: "/staff/rooms",
      });
    }

    const roomNo = room.roomNumber != null ? String(room.roomNumber) : "N/A";
    const brokenNames = [];

    for (const eq of room.roomEquipment || []) {
      if (eq.status !== "broken") continue;
      const name = String(eq.name || "Thiết bị").trim() || "Thiết bị";
      brokenNames.push(name);
    }

    if (brokenNames.length > 0) {
      const namesText = formatEquipmentNamesList(brokenNames);
      tasks.push({
        id: `equipment-broken-${room._id}`,
        type: "equipment_broken",
        text: `Thiết bị hỏng — Phòng ${roomNo}: ${namesText}`,
        meta: brokenNames.length > 2 ? brokenNames.join(", ") : null,
        urgent: true,
        done: false,
        linkTo: "/staff/equipment",
      });
    }
  }

  const TASK_TYPE_ORDER = {
    checkin: 0,
    checkout: 1,
    maintenance: 2,
    equipment_broken: 3,
  };

  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const orderA = TASK_TYPE_ORDER[a.type] ?? 9;
    const orderB = TASK_TYPE_ORDER[b.type] ?? 9;
    if (orderA !== orderB) return orderA - orderB;
    if (a.time && b.time) return String(a.time).localeCompare(String(b.time));
    return String(a.text || "").localeCompare(String(b.text || ""));
  });

  const roomSnapshots = rooms
    .filter(roomNeedsDashboardAttention)
    .sort((a, b) => roomAttentionPriority(a) - roomAttentionPriority(b))
    .map(mapRoomSnapshot);

  const reviews = pendingReviews.map((review) => ({
    id: review._id.toString(),
    guest: review.guest?.name || "Khách hàng",
    rating: review.rating,
    comment: review.comment,
    time: review.createdAt,
    replied: false,
    linkTo: "/staff/reviews",
  }));

  const attentionRooms = rooms.filter(roomNeedsDashboardAttention).length;

  return {
    stats: {
      availableRooms,
      totalRooms,
      equipmentAttentionCount,
      equipmentBrokenCount,
      equipmentUnderRepairCount,
      checkInToday,
      checkOutToday,
      reviewsAwaitingReply,
    },
    tasks,
    rooms: roomSnapshots,
    equipment,
    reviews,
    panelMeta: {
      unfinishedTasks: tasks.filter((t) => !t.done).length,
      attentionRooms,
      equipmentPendingCount: equipmentBrokenCount,
      equipmentUnderRepairCount,
      unrepliedReviews: reviewsAwaitingReply,
    },
  };
}

module.exports = {
  getStaffDashboard,
};
