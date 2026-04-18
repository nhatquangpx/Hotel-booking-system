/**
 * Booking Service
 * Consolidated exports for all booking service functions
 */

// Core functions
const {
  calculateNights,
  calculateAmount,
  checkRoomAvailability,
  validateBookingDates,
  checkBookingPermission,
  canCancelBooking,
  getBookingWithPopulate
} = require("./core");

// Guest booking services
const {
  createBooking: createGuestBooking,
  getMyBookings,
  getBookingById: getGuestBookingById,
  getAvailableRooms,
  cancelBooking: cancelGuestBooking,
  previewBookingPrice,
} = require("./guest");

// Owner booking services
const {
  getBookingsByOwner,
  getBookingById: getOwnerBookingById,
  updateBookingStatus: updateOwnerBookingStatus,
  checkIn,
  checkOut
} = require("./owner");

// Admin booking services
const {
  getAllBookings,
  getUserBookings,
  getBookingById: getAdminBookingById,
  updateBookingStatus: updateAdminBookingStatus
} = require("./admin");

module.exports = {
  // Core functions
  calculateNights,
  calculateAmount,
  checkRoomAvailability,
  validateBookingDates,
  checkBookingPermission,
  canCancelBooking,
  getBookingWithPopulate,
  
  // Guest services
  createGuestBooking,
  getMyBookings,
  getGuestBookingById,
  getAvailableRooms,
  cancelGuestBooking,
  previewBookingPrice,
  
  // Owner services
  getBookingsByOwner,
  getOwnerBookingById,
  updateOwnerBookingStatus,
  checkIn,
  checkOut,
  
  // Admin services
  getAllBookings,
  getUserBookings,
  getAdminBookingById,
  updateAdminBookingStatus
};