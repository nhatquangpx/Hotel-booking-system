const mongoose = require("mongoose");
const Booking = require("../../models/Booking");
const Room = require("../../models/Room");
const Hotel = require("../../models/Hotel");

/**
 * Core Booking Service
 * Helper functions shared across all booking operations
 */

const DEFAULT_REFUND_MIN_DAYS_BEFORE_CHECKIN = 2;

/**
 * Chuẩn hoá một giá trị policies.refundMinDaysBeforeCheckIn (0–90, mặc định khi thiếu/không hợp lệ).
 * Dùng chung cho hotel API và booking (một nguồn sự thật).
 * @param {unknown} raw
 * @returns {number}
 */
const normalizeRefundMinDaysBeforeCheckIn = (raw) => {
  let v = raw;
  if (typeof v === "string") {
    v = v.trim();
  }
  if (v === undefined || v === null || v === "") {
    return DEFAULT_REFUND_MIN_DAYS_BEFORE_CHECKIN;
  }
  const n = Number(v);
  if (!Number.isFinite(n) || n < 0) {
    return DEFAULT_REFUND_MIN_DAYS_BEFORE_CHECKIN;
  }
  return Math.min(90, Math.floor(n));
};

/**
 * X ngày tối thiểu trước ngày nhận phòng theo chính sách khách sạn — chỉ dùng khi xét **hoàn tiền cho đơn đã thanh toán**
 * (getGuestRefundPolicyEligibility). Không áp dụng cho đơn pending.
 */
const getEffectiveRefundMinDaysBeforeCheckIn = (hotelOrPolicies) => {
  const policies =
    hotelOrPolicies && hotelOrPolicies.policies !== undefined
      ? hotelOrPolicies.policies
      : hotelOrPolicies;
  return normalizeRefundMinDaysBeforeCheckIn(policies?.refundMinDaysBeforeCheckIn);
};

/**
 * Calculate number of nights between check-in and check-out dates
 * @param {Date|String} checkInDate - Check-in date
 * @param {Date|String} checkOutDate - Check-out date
 * @returns {Number} Number of nights
 */
const calculateNights = (checkInDate, checkOutDate) => {
  const startDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);
  return Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
};

const { readRoomPrice } = require("../rooms/roomPrice");
const { buildActiveBookingHoldFilter } = require("../../lib/booking/pendingHold");

/**
 * Calculate total amount for a booking
 * @param {Object} room - Room object with price information
 * @param {Number} nights - Number of nights
 * @returns {Number} Total amount
 */
const calculateAmount = (room, nights) => {
  if (!room || !room.price) {
    throw new Error("Room hoặc room.price không hợp lệ");
  }

  return Math.max(0, readRoomPrice(room.price) * nights);
};

/**
 * Truy vấn đơn đặt phòng đang chiếm phòng trùng khoảng ngày.
 */
const buildBookingConflictQuery = (
  roomId,
  startDate,
  endDate,
  excludeBookingId = null,
  now = new Date()
) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const query = {
    room: roomId,
    checkInDate: { $lt: end },
    checkOutDate: { $gt: start },
    ...buildActiveBookingHoldFilter(now),
  };
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }
  return query;
};

/**
 * Check if room is available for the given date range
 * Checks all necessary conditions: booking conflicts and room status
 * NOTE: Room.bookingStatus is NOT used here, it only reflects current occupancy state.
 * @param {String|Object} roomIdOrRoom - Room ID or Room object
 * @param {Date|String} startDate - Check-in date
 * @param {Date|String} endDate - Check-out date
 * @param {String} excludeBookingId - Optional: Booking ID to exclude from check (for updates)
 * @returns {Promise<Boolean>} True if room is available, false otherwise
 */
const checkRoomAvailability = async (roomIdOrRoom, startDate, endDate, excludeBookingId = null) => {
  // Get room object if only roomId is provided
  let room;
  let roomId;

  if (typeof roomIdOrRoom === "string" || roomIdOrRoom instanceof mongoose.Types.ObjectId) {
    roomId = roomIdOrRoom;
    room = await Room.findById(roomId);
  } else {
    room = roomIdOrRoom;
    roomId = room._id || room.id;
  }

  if (!room) {
    return false;
  }

  if (room.roomStatus !== "active") {
    return false;
  }

  const conflictingBooking = await Booking.findOne(
    buildBookingConflictQuery(roomId, startDate, endDate, excludeBookingId)
  );

  return !conflictingBooking;
};

/**
 * Validate booking dates
 * @param {Date|String} checkInDate - Check-in date
 * @param {Date|String} checkOutDate - Check-out date
 * @returns {Object} { valid: Boolean, error: String|null }
 */
const validateBookingDates = (checkInDate, checkOutDate) => {
  const start = new Date(checkInDate);
  const end = new Date(checkOutDate);
  const now = new Date();
  now.setHours(0, 0, 0, 0); // Reset time to start of day

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { valid: false, error: "Ngày không hợp lệ" };
  }

  if (start < now) {
    return { valid: false, error: "Ngày check-in không thể trong quá khứ" };
  }

  if (end <= start) {
    return { valid: false, error: "Ngày check-out phải sau ngày check-in" };
  }

  // Check minimum stay (1 night)
  const nights = calculateNights(start, end);
  if (nights < 1) {
    return { valid: false, error: "Phải đặt ít nhất 1 đêm" };
  }

  return { valid: true, error: null };
};

/** Chuẩn hoá về 00:00:00 local để so sánh ngày lịch (đặt phòng / check-in-out thực tế). */
const toBookingDateOnly = (dateLike) => {
  const d = new Date(dateLike);
  d.setHours(0, 0, 0, 0);
  return d;
};

const formatBookingDateLabel = (dateLike) => {
  const d = toBookingDateOnly(dateLike);
  return d.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
};

/**
 * Check-in thực tế phải nằm trong khoảng đặt phòng:
 * từ ngày checkInDate đã đặt trở đi, và trước ngày checkOutDate đã đặt.
 */
const validateActualCheckInDate = (booking, at = new Date()) => {
  if (!booking?.checkInDate || !booking?.checkOutDate) {
    return { valid: false, error: "Đơn đặt phòng thiếu thông tin ngày lưu trú" };
  }

  const today = toBookingDateOnly(at);
  const bookedCheckIn = toBookingDateOnly(booking.checkInDate);
  const bookedCheckOut = toBookingDateOnly(booking.checkOutDate);

  if (today < bookedCheckIn) {
    return {
      valid: false,
      error: `Hôm nay chưa phải ngày check-in. Ngày nhận phòng đã đặt: ${formatBookingDateLabel(bookedCheckIn)}`,
    };
  }

  if (today >= bookedCheckOut) {
    return {
      valid: false,
      error: `Không thể check-in vì đã đến hoặc qua ngày trả phòng đã đặt (${formatBookingDateLabel(bookedCheckOut)})`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Check-out thực tế phải nằm trong khoảng đặt phòng:
 * không sớm hơn ngày checkInDate đã đặt, không muộn hơn ngày checkOutDate đã đặt.
 */
const validateActualCheckOutDate = (booking, at = new Date()) => {
  if (!booking?.checkInDate || !booking?.checkOutDate) {
    return { valid: false, error: "Đơn đặt phòng thiếu thông tin ngày lưu trú" };
  }

  const today = toBookingDateOnly(at);
  const bookedCheckIn = toBookingDateOnly(booking.checkInDate);
  const bookedCheckOut = toBookingDateOnly(booking.checkOutDate);

  if (today < bookedCheckIn) {
    return {
      valid: false,
      error: `Hôm nay chưa phải ngày check-out. Chưa đến ngày nhận phòng đã đặt (${formatBookingDateLabel(bookedCheckIn)})`,
    };
  }

  if (today > bookedCheckOut) {
    return {
      valid: false,
      error: `Không thể check-out sau ngày trả phòng đã đặt (${formatBookingDateLabel(bookedCheckOut)})`,
    };
  }

  return { valid: true, error: null };
};

/**
 * Check if user has permission to access/modify a booking
 * @param {Object} booking - Booking object (may be populated with hotel/guest)
 * @param {Object} user - User object with role and id
 * @returns {Boolean} True if user has permission
 */
const checkBookingPermission = (booking, user) => {
  if (!booking || !user) {
    return false;
  }

  const userId = user.id || user._id;
  const userRole = user.role;

  // Admin has full access
  if (userRole === "admin") {
    return true;
  }

  // Guest can access their own bookings
  if (userRole === "guest") {
    // Handle both populated (object) and unpopulated (ObjectId) guest
    let guestId;
    if (booking.guest && typeof booking.guest === 'object' && booking.guest._id) {
      // Guest is populated (object with _id)
      guestId = booking.guest._id.toString();
    } else if (booking.guest && typeof booking.guest === 'object' && booking.guest.id) {
      // Guest is populated (object with id)
      guestId = booking.guest.id.toString();
    } else {
      // Guest is ObjectId (not populated)
      guestId = booking.guest?.toString ? booking.guest.toString() : String(booking.guest);
    }
    return guestId === String(userId);
  }

  // Owner can access bookings for their hotels
  if (userRole === "owner") {
    const hotel = booking.hotel;
    if (!hotel) {
      return false;
    }

    // Handle both populated and unpopulated hotel
    let ownerId;
    if (hotel.ownerId && typeof hotel.ownerId === 'object' && hotel.ownerId._id) {
      // ownerId is populated (object with _id)
      ownerId = hotel.ownerId._id.toString();
    } else if (hotel.ownerId && typeof hotel.ownerId === 'object' && hotel.ownerId.id) {
      // ownerId is populated (object with id)
      ownerId = hotel.ownerId.id.toString();
    } else {
      // ownerId is ObjectId (not populated)
      ownerId = hotel.ownerId?.toString ? hotel.ownerId.toString() : String(hotel.ownerId);
    }
    return ownerId === String(userId);
  }

  return false;
};

/**
 * Khách có thể gửi hủy đơn (chưa check-in/out, chưa hủy).
 * Điều kiện hoàn tiền tách riêng: {@link getGuestRefundPolicyEligibility}.
 */
const canGuestCancelBooking = (booking) => {
  if (!booking) {
    return { canCancel: false, error: "Không tìm thấy đơn đặt phòng" };
  }

  if (booking.paymentStatus === "cancelled") {
    return { canCancel: false, error: "Đơn đặt phòng đã được hủy trước đó" };
  }

  if (booking.paymentStatus !== "pending" && booking.paymentStatus !== "paid") {
    return { canCancel: false, error: "Không thể hủy đơn đặt phòng này" };
  }

  if (booking.checkedInAt || booking.checkedOutAt) {
    return {
      canCancel: false,
      error:
        "Không thể hủy đơn sau khi đã check-in hoặc check-out. Vui lòng liên hệ khách sạn."
    };
  }

  return { canCancel: true, error: null };
};

/** @deprecated Dùng canGuestCancelBooking */
const canCancelBooking = canGuestCancelBooking;

/**
 * Đơn đã thanh toán có đủ số ngày trước check-in theo chính sách hoàn tiền của KS hay không.
 * @returns {{ eligible: boolean, minNoticeDays: number, daysUntilCheckIn: number }}
 */
const getGuestRefundPolicyEligibility = (booking) => {
  if (!booking || booking.paymentStatus !== "paid") {
    return { eligible: false, minNoticeDays: 0, daysUntilCheckIn: 0 };
  }
  const minNoticeDays = getEffectiveRefundMinDaysBeforeCheckIn(booking.hotel || {});
  const checkInDate = new Date(booking.checkInDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkInDate.setHours(0, 0, 0, 0);
  const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));
  return {
    eligible: daysUntilCheckIn >= minNoticeDays,
    minNoticeDays,
    daysUntilCheckIn
  };
};

/**
 * Get booking with populated fields
 * @param {String} bookingId - Booking ID
 * @param {Object} populateOptions - Populate options
 * @returns {Promise<Object|null>} Booking object or null
 */
const getBookingWithPopulate = async (bookingId, populateOptions = {}) => {
  let query = Booking.findById(bookingId);

  // Default populate options
  const defaults = {
    hotel: "name address images starRating contactInfo policies +paymentConfig",
    room: "roomNumber type price images maxPeople description facilities",
    guest: "name email phone"
  };

  const hotelSelect = populateOptions.hotel || defaults.hotel;
  const roomSelect = populateOptions.room || defaults.room;
  const guestSelect = populateOptions.guest || defaults.guest;

  query = query
    .populate({ path: "hotel", select: hotelSelect })
    .populate({ path: "room", select: roomSelect })
    .populate({ path: "guest", select: guestSelect });

  return await query;
};

/**
 * Get booking by ID with permission check (shared function for all roles)
 * @param {String} bookingId - Booking ID
 * @param {Object} user - User object with role and id
 * @param {Object} populateOptions - Optional populate options (hotel, room, guest fields)
 * @returns {Promise<Object>} Booking object
 */
const getBookingById = async (bookingId, user, populateOptions = {}) => {
  const booking = await getBookingWithPopulate(bookingId, populateOptions);

  if (!booking) {
    throw new Error("Không tìm thấy đơn đặt phòng");
  }

  // Check permission
  if (!checkBookingPermission(booking, user)) {
    throw new Error("Bạn không có quyền xem đơn đặt phòng này");
  }

  return booking;
};

/**
 * Refresh room.bookingStatus based on REAL-TIME bookings
 * - "occupied": there is an active stay (checkedInAt != null && checkedOutAt == null)
 * - "pending": there is at least one upcoming/ongoing booking that has not been checked-in yet
 * - "empty": no active or upcoming bookings
 * NOTE: This does NOT affect availability logic, only the runtime occupancy state.
 * @param {String|ObjectId} roomId - Room ID
 * @returns {Promise<Object|null>} Updated room or null if room not found
 */
const refreshRoomBookingStatus = async (roomId) => {
  if (!roomId) return null;

  const room = await Room.findById(roomId);
  if (!room) {
    return null;
  }

  const now = new Date();

  // Find relevant bookings for this room that are not fully in the past
  const bookings = await Booking.find({
    room: room._id,
    checkOutDate: { $gt: now },
    ...buildActiveBookingHoldFilter(now),
  });

  // 1. Occupied: has been checked-in and not yet checked-out
  const occupiedBooking = bookings.find(
    (b) => b.checkedInAt && !b.checkedOutAt
  );

  if (occupiedBooking) {
    if (room.bookingStatus !== "occupied") {
      room.bookingStatus = "occupied";
      await room.save();
    }
    return room;
  }

  // 2. Pending: there is at least one upcoming/ongoing booking that has not been checked-in yet
  const pendingBooking = bookings.find(
    (b) => !b.checkedInAt
  );

  if (pendingBooking) {
    if (room.bookingStatus !== "pending") {
      room.bookingStatus = "pending";
      await room.save();
    }
    return room;
  }

  // 3. Otherwise: empty
  if (room.bookingStatus !== "empty") {
    room.bookingStatus = "empty";
    await room.save();
  }

  return room;
};

module.exports = {
  calculateNights,
  calculateAmount,
  buildBookingConflictQuery,
  checkRoomAvailability,
  DEFAULT_REFUND_MIN_DAYS_BEFORE_CHECKIN,
  normalizeRefundMinDaysBeforeCheckIn,
  getEffectiveRefundMinDaysBeforeCheckIn,
  validateBookingDates,
  toBookingDateOnly,
  validateActualCheckInDate,
  validateActualCheckOutDate,
  checkBookingPermission,
  canGuestCancelBooking,
  canCancelBooking,
  getGuestRefundPolicyEligibility,
  getBookingWithPopulate,
  getBookingById,
  refreshRoomBookingStatus
};