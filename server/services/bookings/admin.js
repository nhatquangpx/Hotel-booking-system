const Booking = require("../../models/Booking");
const {
  getBookingById: getBookingByIdCore,
} = require("./core");

/**
 * Admin Booking Service
 * All booking operations specific to admin role
 */

/**
 * Get all bookings (admin only)
 * @returns {Promise<Array>} Array of bookings
 */
const getAllBookings = async () => {
  const bookings = await Booking.find({})
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
    hotel: "name address images starRating contactInfo policies +paymentConfig",
    room: "roomNumber type price images maxPeople description facilities",
    guest: "name email phone"
  });
};

module.exports = {
  getAllBookings,
  getUserBookings,
  getBookingById,
};
