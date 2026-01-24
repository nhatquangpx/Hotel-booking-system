const mongoose = require("mongoose");
const Booking = require("../../models/Booking");
const Room = require("../../models/Room");
const Hotel = require("../../models/Hotel");

/**
 * Core Booking Service
 * Helper functions shared across all booking operations
 */

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

  let totalAmount = room.price.regular * nights;
  if (room.price.discount && room.price.discount > 0) {
    totalAmount -= room.price.discount * nights;
  }

  return Math.max(0, totalAmount); // Đảm bảo không âm
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
  const start = new Date(startDate);
  const end = new Date(endDate);

  // Get room object if only roomId is provided
  let room;
  let roomId;
  
  if (typeof roomIdOrRoom === 'string' || roomIdOrRoom instanceof mongoose.Types.ObjectId) {
    roomId = roomIdOrRoom;
    room = await Room.findById(roomId);
  } else {
    room = roomIdOrRoom;
    roomId = room._id || room.id;
  }

  // Check if room exists
  if (!room) {
    return false;
  }

  // Check room status - must be active
  if (room.roomStatus !== "active") {
    return false;
  }

  // Find conflicting bookings
  const query = {
    room: roomId,
    checkInDate: { $lt: end },
    checkOutDate: { $gt: start },
    paymentStatus: { $in: ["pending", "paid"] } // Only consider active bookings
  };

  // Exclude current booking when updating
  if (excludeBookingId) {
    query._id = { $ne: excludeBookingId };
  }

  const conflictingBooking = await Booking.findOne(query);
  
  // Room is available only if no conflicting booking found
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
    const guestId = booking.guest?.toString ? booking.guest.toString() : String(booking.guest);
    return guestId === String(userId);
  }

  // Owner can access bookings for their hotels
  if (userRole === "owner") {
    const hotel = booking.hotel;
    if (!hotel) {
      return false;
    }

    // Handle both populated and unpopulated hotel
    const ownerId = hotel.ownerId?.toString ? hotel.ownerId.toString() : String(hotel.ownerId);
    return ownerId === String(userId);
  }

  return false;
};

/**
 * Check if booking can be cancelled
 * @param {Object} booking - Booking object
 * @returns {Object} { canCancel: Boolean, error: String|null }
 */
const canCancelBooking = (booking) => {
  if (!booking) {
    return { canCancel: false, error: "Không tìm thấy đơn đặt phòng" };
  }

  // Check if already paid
  if (booking.paymentStatus === "paid") {
    return { canCancel: false, error: "Không thể hủy đơn đặt phòng đã thanh toán" };
  }

  // Check if already cancelled
  if (booking.paymentStatus === "cancelled") {
    return { canCancel: false, error: "Đơn đặt phòng đã được hủy trước đó" };
  }

  // Check if check-in date is less than 2 days away
  const checkInDate = new Date(booking.checkInDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));

  if (daysUntilCheckIn < 2) {
    return {
      canCancel: false,
      error: "Không thể hủy đơn đặt phòng trong vòng 2 ngày trước ngày nhận phòng"
    };
  }

  return { canCancel: true, error: null };
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
    hotel: "name address images starRating contactInfo policies",
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
    paymentStatus: { $in: ["pending", "paid"] },
    checkOutDate: { $gt: now }
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
  checkRoomAvailability,
  validateBookingDates,
  checkBookingPermission,
  canCancelBooking,
  getBookingWithPopulate,
  getBookingById,
  refreshRoomBookingStatus
};