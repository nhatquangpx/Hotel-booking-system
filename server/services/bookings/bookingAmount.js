/** Số tiền khách phải trả (sau sale). */
function getBookingFinalAmount(booking) {
  if (!booking) return 0;
  const n = Number(booking.finalAmount);
  return Number.isFinite(n) ? Math.max(0, n) : 0;
}

/** Biểu thức MongoDB $sum doanh thu từ finalAmount. */
const bookingRevenueSumExpr = "$finalAmount";

module.exports = { getBookingFinalAmount, bookingRevenueSumExpr };
