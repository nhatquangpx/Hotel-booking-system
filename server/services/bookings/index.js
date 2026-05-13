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
  getEffectiveRefundMinDaysBeforeCheckIn,
  normalizeRefundMinDaysBeforeCheckIn,
  checkBookingPermission,
  canGuestCancelBooking,
  canCancelBooking,
  getGuestRefundPolicyEligibility,
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
  confirmGuestRefund: confirmOwnerGuestRefund,
  checkIn,
  checkOut
} = require("./owner");

// Admin booking services (chỉ đọc — không cập nhật trạng thái đơn)
const {
  getAllBookings,
  getUserBookings,
  getBookingById: getAdminBookingById,
} = require("./admin");

module.exports = {
  // Core functions
  calculateNights,
  calculateAmount,
  checkRoomAvailability,
  validateBookingDates,
  getEffectiveRefundMinDaysBeforeCheckIn,
  normalizeRefundMinDaysBeforeCheckIn,
  checkBookingPermission,
  canGuestCancelBooking,
  canCancelBooking,
  getGuestRefundPolicyEligibility,
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
  confirmOwnerGuestRefund,
  checkIn,
  checkOut,
  
  // Admin services
  getAllBookings,
  getUserBookings,
  getAdminBookingById,
};