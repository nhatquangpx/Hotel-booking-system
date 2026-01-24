const Booking = require("../../models/Booking");
const {
  checkBookingPermission,
  getBookingById: getBookingByIdCore,
  refreshRoomBookingStatus
} = require("./core");

/**
 * Admin Booking Service
 * All booking operations specific to admin role
 */

/**
 * Get all bookings with optional filters (admin only)
 * @param {Object} filters - Filter options
 * @param {String} filters.paymentStatus - Payment status
 * @param {Date|String} filters.fromDate - From date (check-in)
 * @param {Date|String} filters.toDate - To date (check-out)
 * @returns {Promise<Array>} Array of bookings
 */
const getAllBookings = async (filters = {}) => {
  const { paymentStatus, fromDate, toDate } = filters;
  let query = {};

  // Apply filters
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (fromDate) query.checkInDate = { $gte: new Date(fromDate) };
  if (toDate) query.checkOutDate = { $lte: new Date(toDate) };

  const bookings = await Booking.find(query)
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
 * Get all bookings for a specific user (admin only)
 * @param {String} userId - User ID
 * @returns {Promise<Array>} Array of bookings
 */
const getUserBookings = async (userId) => {
  const bookings = await Booking.find({ guest: userId })
    .populate({
      path: "hotel",
      select: "name"
    })
    .populate({
      path: "room",
      select: "roomNumber"
    })
    .sort({ createdAt: -1 });

  // Format data for frontend
  const formatted = bookings.map(b => ({
    _id: b._id,
    hotelId: b.hotel?._id,
    hotelName: b.hotel?.name,
    roomId: b.room?._id,
    roomNumber: b.room?.roomNumber,
    checkIn: b.checkInDate,
    checkOut: b.checkOutDate,
    status: b.paymentStatus
  }));

  return formatted;
};

/**
 * Get booking by ID (admin has full access)
 * @param {String} bookingId - Booking ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Booking object
 */
const getBookingById = async (bookingId, user) => {
  return await getBookingByIdCore(bookingId, user, {
    hotel: "name address images starRating contactInfo policies",
    room: "roomNumber type price images maxPeople description facilities",
    guest: "name email phone"
  });
};

/**
 * Update booking status (admin has full access)
 * @param {String} bookingId - Booking ID
 * @param {String} status - New status (pending, paid, cancelled)
 * @param {Object} user - User object
 * @returns {Promise<Object>} Updated booking
 */
const updateBookingStatus = async (bookingId, status, user) => {
  const booking = await Booking.findById(bookingId);

  if (!booking) {
    throw new Error("Đơn đặt phòng không tồn tại");
  }

  // Admin has full access, but we still check permission for consistency
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

  // Refresh room bookingStatus (especially when admin cancels or reactivates a booking)
  if (booking.room) {
    await refreshRoomBookingStatus(booking.room);
  }

  return booking;
};

module.exports = {
  getAllBookings,
  getUserBookings,
  getBookingById,
  updateBookingStatus
};