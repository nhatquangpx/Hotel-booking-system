/**
 * Kiểm tra / hủy đơn pending quá thời hạn giữ phòng.
 * Chỉ hủy khi quá hạn và khách chưa báo chuyển khoản QR (chưa gửi minh chứng).
 * Đã mở VNPay nhưng chưa thanh toán vẫn bị hủy khi quá hạn.
 */
function isPendingHoldExpired(booking, now = new Date()) {
  if (!booking || booking.paymentStatus !== "pending") return false;
  if (!booking.pendingExpiresAt) return false;
  if (booking.qrPaymentReportedAt) return false;
  return new Date(booking.pendingExpiresAt).getTime() <= now.getTime();
}

/**
 * Điều kiện MongoDB: đơn đang thực sự giữ phòng
 * (paid, hoặc pending còn hạn / chưa có hạn / đã báo chuyển khoản QR chờ duyệt).
 */
function buildActiveBookingHoldFilter(now = new Date()) {
  return {
    $or: [
      { paymentStatus: "paid" },
      {
        paymentStatus: "pending",
        $or: [
          { pendingExpiresAt: { $exists: false } },
          { pendingExpiresAt: null },
          { pendingExpiresAt: { $gt: now } },
          { qrPaymentReportedAt: { $exists: true, $ne: null } },
        ],
      },
    ],
  };
}

module.exports = {
  isPendingHoldExpired,
  buildActiveBookingHoldFilter,
};
