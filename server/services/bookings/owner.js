const Booking = require("../../models/Booking");
const { getScopedHotelIdsForOwner } = require("../dashboards/core");
const {
  checkBookingPermission,
  getBookingById: getBookingByIdCore,
  refreshRoomBookingStatus
} = require("./core");

/**
 * Owner Booking Service
 * All booking operations specific to owner role
 */

/**
 * Get all bookings for owner's hotels
 * @param {String} ownerId - Owner user ID
 * @returns {Promise<Array>} Array of bookings
 */
const getBookingsByOwner = async (ownerId, hotelId) => {
  const hotelIds = await getScopedHotelIdsForOwner(ownerId, hotelId || null);

  if (hotelIds.length === 0) {
    return [];
  }

  const bookings = await Booking.find({ hotel: { $in: hotelIds } })
    .populate({
      path: "hotel",
      select: "name address"
    })
    .populate({
      path: "room",
      select: "roomNumber type"
    })
    .populate({
      path: "guest",
      select: "name email phone"
    })
    .sort({ createdAt: -1 });

  return bookings;
};

/**
 * Get booking by ID (with permission check for owner)
 * @param {String} bookingId - Booking ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Booking object
 */
const getBookingById = async (bookingId, user) => {
  return await getBookingByIdCore(bookingId, user, {
    hotel: "name address images starRating contactInfo policies ownerId",
    room: "roomNumber type price images maxPeople description facilities",
    guest: "name email phone"
  });
};

/**
 * Update booking status (owner can update bookings for their hotels)
 * @param {String} bookingId - Booking ID
 * @param {String} status - New status (pending, paid, cancelled)
 * @param {Object} user - User object
 * @returns {Promise<Object>} Updated booking
 */
const updateBookingStatus = async (bookingId, status, user) => {
  // Find booking and populate hotel to check permission
  const booking = await Booking.findById(bookingId).populate({
    path: "hotel",
    select: "ownerId"
  });

  if (!booking) {
    throw new Error("Đơn đặt phòng không tồn tại");
  }

  // Check permission (owner can only update bookings for their hotels)
  if (!checkBookingPermission(booking, user)) {
    throw new Error("Bạn không có quyền thực hiện thao tác này");
  }

  // Validate status
  const validStatuses = ["pending", "paid", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new Error("Trạng thái không hợp lệ");
  }

  // Update status
  booking.paymentStatus = status;
  await booking.save();

  // Refresh room bookingStatus (in case status change affects occupancy state)
  if (booking.room) {
    await refreshRoomBookingStatus(booking.room);
  }

  return booking;
};

/**
 * Check-in a booking (owner only)
 * @param {String} bookingId - Booking ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Updated booking
 */
const checkIn = async (bookingId, user) => {
  // Find booking and populate hotel to check permission
  const booking = await Booking.findById(bookingId).populate({
    path: "hotel",
    select: "ownerId"
  });

  if (!booking) {
    throw new Error("Đơn đặt phòng không tồn tại");
  }

  // Check permission (owner can only check-in bookings for their hotels)
  if (!checkBookingPermission(booking, user)) {
    throw new Error("Bạn không có quyền thực hiện check-in cho đơn đặt phòng này");
  }

  // Check if booking is paid
  if (booking.paymentStatus !== "paid") {
    throw new Error("Chỉ có thể check-in khi đơn đặt phòng đã được thanh toán");
  }

  // Check if already checked in
  if (booking.checkedInAt) {
    throw new Error("Đơn đặt phòng đã được check-in trước đó");
  }

  // Perform check-in
  booking.checkedInAt = new Date();
  await booking.save();

  // Room is now occupied
  if (booking.room) {
    await refreshRoomBookingStatus(booking.room);
  }

  return booking;
};

/**
 * Check-out a booking (owner only)
 * @param {String} bookingId - Booking ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Updated booking
 */
const checkOut = async (bookingId, user) => {
  // Find booking and populate hotel to check permission
  const booking = await Booking.findById(bookingId).populate({
    path: "hotel",
    select: "ownerId"
  });

  if (!booking) {
    throw new Error("Đơn đặt phòng không tồn tại");
  }

  // Check permission (owner can only check-out bookings for their hotels)
  if (!checkBookingPermission(booking, user)) {
    throw new Error("Bạn không có quyền thực hiện check-out cho đơn đặt phòng này");
  }

  // Check if already checked in
  if (!booking.checkedInAt) {
    throw new Error("Bạn phải check-in trước khi check-out");
  }

  // Check if already checked out
  if (booking.checkedOutAt) {
    throw new Error("Đơn đặt phòng đã được check-out trước đó");
  }

  // Perform check-out
  booking.checkedOutAt = new Date();
  await booking.save();

  // After check-out, room may become empty or pending (if there is another booking today)
  if (booking.room) {
    await refreshRoomBookingStatus(booking.room);
  }

  return booking;
};

module.exports = {
  getBookingsByOwner,
  getBookingById,
  updateBookingStatus,
  checkIn,
  checkOut
};