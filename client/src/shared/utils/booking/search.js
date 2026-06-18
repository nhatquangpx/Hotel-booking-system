/** Bộ lọc tìm kiếm dùng chung cho hàng đợi đơn của chủ khách sạn. */

export function matchesBookingSearch(booking, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return true;

  const guestName = (booking.guest?.name || '').toLowerCase();
  const guestPhone = (booking.guest?.phone || '').toLowerCase();
  const bookingId = (booking._id || '').toLowerCase();
  const roomNumber = String(booking.room?.roomNumber || '').toLowerCase();

  return (
    guestName.includes(q) ||
    guestPhone.includes(q) ||
    bookingId.includes(q) ||
    roomNumber.includes(q)
  );
}

export function matchesPaymentMethodFilter(booking, methodFilter) {
  if (!methodFilter || methodFilter === 'all') return true;
  return booking.paymentMethod === methodFilter;
}

export function matchesProofFilter(booking, proofFilter) {
  if (!proofFilter || proofFilter === 'all') return true;
  if (proofFilter === 'proof_submitted') {
    return booking.paymentMethod === 'qr_code' && Boolean(booking.qrPaymentReportedAt);
  }
  if (proofFilter === 'proof_missing') {
    return booking.paymentMethod === 'qr_code' && !booking.qrPaymentReportedAt;
  }
  return true;
}
