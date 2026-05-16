import { isTodayCheckInOrCheckOut } from './bookingFilters';

/**
 * Lọc danh sách đặt phòng (dùng chung owner/staff).
 */
export function filterBookingList(
  bookings,
  {
    showTodayOnly,
    showPastBookings,
    searchQuery,
    statusFilter,
    methodFilter,
    proofFilter,
  }
) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const query = (searchQuery || '').trim().toLowerCase();

  return bookings.filter((booking) => {
    if (showTodayOnly) {
      if (!isTodayCheckInOrCheckOut(booking)) return false;
    } else if (!showPastBookings) {
      const checkInDate = new Date(booking.checkInDate);
      checkInDate.setHours(0, 0, 0, 0);
      if (checkInDate < today) return false;
    }

    if (query) {
      const guestName = (booking.guest?.name || '').toLowerCase();
      const guestPhone = (booking.guest?.phone || '').toLowerCase();
      const bookingId = (booking._id || '').toLowerCase();
      if (
        !guestName.includes(query) &&
        !guestPhone.includes(query) &&
        !bookingId.includes(query)
      ) {
        return false;
      }
    }

    if (statusFilter !== 'all' && booking.paymentStatus !== statusFilter) {
      return false;
    }

    if (methodFilter !== 'all' && booking.paymentMethod !== methodFilter) {
      return false;
    }

    if (proofFilter === 'proof_submitted') {
      return booking.paymentMethod === 'qr_code' && Boolean(booking.qrPaymentReportedAt);
    }

    if (proofFilter === 'proof_missing') {
      return booking.paymentMethod === 'qr_code' && !booking.qrPaymentReportedAt;
    }

    return true;
  });
}
