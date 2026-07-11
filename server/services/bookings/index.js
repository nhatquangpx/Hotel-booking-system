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
  isBookingEffectivelyPaid,
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
  getBookingsByRoomForOwner,
  getBookingById: getOwnerBookingById,
  updateBookingStatus: updateOwnerBookingStatus,
  confirmGuestRefund: confirmOwnerGuestRefund,
  rejectQrPayment: rejectOwnerQrPayment,
  checkIn,
  checkOut
} = require("./owner");

// Admin booking services (chỉ đọc — không cập nhật trạng thái đơn)
const {
  getAllBookings,
  getUserBookings,
  getBookingById: getAdminBookingById,
} = require("./admin");

// Staff booking services (xem + check-in/out)
const {
  getBookingsByStaff,
  getBookingById: getStaffBookingById,
  checkIn: staffCheckIn,
  checkOut: staffCheckOut,
} = require("./staff");

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
  isBookingEffectivelyPaid,
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
  getBookingsByRoomForOwner,
  getOwnerBookingById,
  updateOwnerBookingStatus,
  confirmOwnerGuestRefund,
  rejectOwnerQrPayment,
  checkIn,
  checkOut,

  // Staff services
  getBookingsByStaff,
  getStaffBookingById,
  staffCheckIn,
  staffCheckOut,
  
  // Admin services
  getAllBookings,
  getUserBookings,
  getAdminBookingById,
};