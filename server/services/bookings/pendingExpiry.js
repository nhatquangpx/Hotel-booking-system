const Booking = require("../../models/Booking");
const { refreshRoomBookingStatus } = require("./core");
const { isPendingHoldExpired } = require("../../lib/booking/pendingHold");

const SYSTEM_CANCEL_REASON =
  "Hệ thống tự động hủy — quá thời hạn giữ phòng chưa thanh toán";

/**
 * Hủy các đơn pending quá hạn giữ phòng.
 * Giữ đơn đã gửi minh chứng QR (qrPaymentReportedAt) để chủ khách sạn đối soát.
 * @returns {Promise<{ cancelled: number, roomIds: string[] }>}
 */
async function cancelExpiredPendingBookings() {
  const now = new Date();
  const expired = await Booking.find({
    paymentStatus: "pending",
    pendingExpiresAt: { $lte: now },
    $or: [{ qrPaymentReportedAt: { $exists: false } }, { qrPaymentReportedAt: null }],
  }).select("_id room");

  if (expired.length === 0) {
    return { cancelled: 0, roomIds: [] };
  }

  const roomIds = new Set();
  for (const booking of expired) {
    roomIds.add(String(booking.room));
  }

  const updateResult = await Booking.updateMany(
    {
      _id: { $in: expired.map((b) => b._id) },
      paymentStatus: "pending",
      pendingExpiresAt: { $lte: now },
      $or: [{ qrPaymentReportedAt: { $exists: false } }, { qrPaymentReportedAt: null }],
    },
    {
      $set: {
        paymentStatus: "cancelled",
        cancellationReason: SYSTEM_CANCEL_REASON,
      },
      $unset: { pendingExpiresAt: "" },
    }
  );

  if (updateResult.modifiedCount === 0) {
    return { cancelled: 0, roomIds: [] };
  }

  for (const roomId of roomIds) {
    await refreshRoomBookingStatus(roomId);
  }

  return { cancelled: updateResult.modifiedCount, roomIds: [...roomIds] };
}

/**
 * Hủy một đơn nếu đã quá hạn giữ phòng; trả về document sau cập nhật hoặc null.
 */
async function cancelPendingBookingDueToExpiry(booking) {
  if (!booking || !isPendingHoldExpired(booking)) return null;

  await Booking.updateOne(
    { _id: booking._id, paymentStatus: "pending" },
    {
      $set: {
        paymentStatus: "cancelled",
        cancellationReason: SYSTEM_CANCEL_REASON,
      },
      $unset: { pendingExpiresAt: "" },
    }
  );

  await refreshRoomBookingStatus(booking.room);
  return Booking.findById(booking._id);
}

module.exports = {
  SYSTEM_CANCEL_REASON,
  cancelExpiredPendingBookings,
  cancelPendingBookingDueToExpiry,
};
