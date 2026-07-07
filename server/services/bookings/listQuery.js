const { escapeRegex } = require("../../lib/http/pagination");
const mongoose = require("mongoose");

const User = require("../../models/User");
const Room = require("../../models/Room");

/** Chuỗi có thể là một phần mã đơn (ObjectId hex). */
function isObjectIdSearchFragment(q) {
  return /^[a-fA-F0-9]{4,24}$/.test(String(q || "").trim());
}

function isFullObjectIdString(q) {
  const trimmed = String(q || "").trim();
  return trimmed.length === 24 && mongoose.Types.ObjectId.isValid(trimmed);
}

/** Điều kiện tìm theo mã đơn — không dùng $regex trực tiếp trên field ObjectId. */
function buildBookingIdSearchCondition(q) {
  const trimmed = String(q || "").trim();
  if (!isObjectIdSearchFragment(trimmed)) return null;

  if (isFullObjectIdString(trimmed)) {
    return { _id: new mongoose.Types.ObjectId(trimmed) };
  }

  return {
    $expr: {
      $regexMatch: {
        input: { $toString: "$_id" },
        regex: escapeRegex(trimmed),
        options: "i",
      },
    },
  };
}

/**
 * Điều kiện tìm booking theo tên/SĐT khách, số phòng, hoặc mã đơn (hex).
 * Không regex trên _id khi query là tên thường — tránh lỗi Mongoose "Can't use $options".
 */
async function buildBookingSearchFilter(q, { hotelIds } = {}) {
  const trimmed = String(q || "").trim();
  if (!trimmed) return null;

  const regex = { $regex: escapeRegex(trimmed), $options: "i" };
  const roomQuery = hotelIds?.length
    ? Room.find({ hotelId: { $in: hotelIds }, roomNumber: regex }).select("_id")
    : Promise.resolve([]);

  const [guests, rooms] = await Promise.all([
    User.find({ $or: [{ name: regex }, { phone: regex }] }).select("_id"),
    roomQuery,
  ]);

  const searchConditions = [];
  const idCondition = buildBookingIdSearchCondition(trimmed);
  if (idCondition) searchConditions.push(idCondition);
  if (guests.length) {
    searchConditions.push({ guest: { $in: guests.map((g) => g._id) } });
  }
  if (rooms.length) {
    searchConditions.push({ room: { $in: rooms.map((r) => r._id) } });
  }

  if (!searchConditions.length) {
    return { _id: { $in: [] } };
  }
  return { $or: searchConditions };
}

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function buildAdminBookingFilterQuery({
  searchTerm,
  searchEmail,
  searchPhone,
  searchCode,
  searchHotelName,
  startDate,
  endDate,
}) {
  const bookingConditions = [];

  const code = String(searchCode || "").trim();
  const hotelName = String(searchHotelName || "").trim();

  if (code) {
    const idCondition = buildBookingIdSearchCondition(code);
    if (idCondition) bookingConditions.push(idCondition);
  }
  if (startDate) {
    bookingConditions.push({ checkInDate: { $gte: new Date(startDate) } });
  }
  if (endDate) {
    bookingConditions.push({ checkOutDate: { $lte: new Date(endDate) } });
  }

  const guestQuery = {};
  const term = String(searchTerm || "").trim();
  const email = String(searchEmail || "").trim();
  const phone = String(searchPhone || "").trim();
  if (term) guestQuery.name = { $regex: escapeRegex(term), $options: "i" };
  if (email) guestQuery.email = { $regex: escapeRegex(email), $options: "i" };
  if (phone) guestQuery.phone = { $regex: escapeRegex(phone), $options: "i" };

  return {
    bookingMatch: bookingConditions.length ? { $and: bookingConditions } : {},
    guestQuery,
    hotelName,
  };
}

function buildOwnerBookingFilterQuery({
  showPastBookings,
  statusFilter,
  methodFilter,
  proofFilter,
}) {
  const conditions = [];
  const today = startOfDay();

  if (!showPastBookings || showPastBookings === "false") {
    conditions.push({ checkInDate: { $gte: today } });
  }

  if (statusFilter && statusFilter !== "all") {
    conditions.push({ paymentStatus: statusFilter });
  }

  if (methodFilter && methodFilter !== "all") {
    conditions.push({ paymentMethod: methodFilter });
  }

  if (proofFilter === "proof_submitted") {
    conditions.push({
      paymentMethod: "qr_code",
      qrPaymentReportedAt: { $ne: null },
    });
  } else if (proofFilter === "proof_missing") {
    conditions.push({
      paymentMethod: "qr_code",
      $or: [{ qrPaymentReportedAt: null }, { qrPaymentReportedAt: { $exists: false } }],
    });
  }

  return conditions.length ? { $and: conditions } : {};
}

function buildStaffActionBookingQuery(referenceDate = new Date()) {
  const dayStart = startOfDay(referenceDate);
  const dayEnd = endOfDay(referenceDate);

  return {
    $or: [
      {
        paymentStatus: "paid",
        checkedInAt: null,
        checkInDate: { $gte: dayStart, $lte: dayEnd },
      },
      {
        paymentStatus: "paid",
        checkedInAt: { $ne: null },
        checkedOutAt: null,
        checkOutDate: { $gte: dayStart, $lte: dayEnd },
      },
      {
        paymentStatus: "paid",
        checkedInAt: { $ne: null },
        checkedOutAt: null,
        checkOutDate: { $lt: dayStart },
      },
    ],
  };
}

function buildOwnerActionBookingQuery(referenceDate = new Date()) {
  const dayStart = startOfDay(referenceDate);
  const dayEnd = endOfDay(referenceDate);

  return {
    $or: [
      { paymentStatus: "pending" },
      {
        paymentStatus: "cancelled",
        "guestCancelSnapshot.wasPaid": true,
        "guestCancelSnapshot.refundPolicyEligible": true,
        guestCancelRequestedAt: { $ne: null },
        ownerRefundCompletedAt: null,
      },
      {
        paymentStatus: "paid",
        checkedInAt: null,
        checkInDate: { $gte: dayStart, $lte: dayEnd },
      },
      {
        paymentStatus: "paid",
        checkedInAt: { $ne: null },
        checkedOutAt: null,
        checkOutDate: { $gte: dayStart, $lte: dayEnd },
      },
      {
        paymentStatus: "paid",
        checkedInAt: { $ne: null },
        checkedOutAt: null,
        checkOutDate: { $lt: dayStart },
      },
    ],
  };
}

const BOOKING_POPULATE = [
  { path: "hotel", select: "name address" },
  { path: "room", select: "roomNumber type" },
  { path: "guest", select: "name email phone" },
];

module.exports = {
  BOOKING_POPULATE,
  buildAdminBookingFilterQuery,
  buildOwnerBookingFilterQuery,
  buildOwnerActionBookingQuery,
  buildStaffActionBookingQuery,
  buildBookingSearchFilter,
  buildBookingIdSearchCondition,
  isObjectIdSearchFragment,
  startOfDay,
  endOfDay,
};
