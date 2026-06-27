/**
 * Đếm ngược thời hạn giữ phòng (pendingExpiresAt từ server).
 */

export function getPendingHoldRemainingMs(pendingExpiresAt) {
  if (!pendingExpiresAt) return null;
  const expiresAt = new Date(pendingExpiresAt).getTime();
  if (Number.isNaN(expiresAt)) return null;
  return Math.max(0, expiresAt - Date.now());
}

export function isPendingHoldExpired(pendingExpiresAt, now = Date.now()) {
  const ms = getPendingHoldRemainingMs(pendingExpiresAt);
  if (ms === null) return false;
  return ms <= 0;
}

export function formatPendingHoldCountdown(remainingSeconds) {
  const total = Math.max(0, Math.floor(remainingSeconds));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

export function isPendingHoldTrackable(booking) {
  if (booking?.paymentStatus !== 'pending') return false;
  if (!booking?.pendingExpiresAt) return false;
  if (booking.qrPaymentReportedAt) return false;
  return true;
}

export function shouldShowPendingHoldCountdown(booking) {
  return isPendingHoldTrackable(booking) && !isPendingHoldExpired(booking.pendingExpiresAt);
}

/** Đơn pending còn track hold nhưng đã hết hạn phía client (cron có thể chưa cập nhật DB). */
export function isPendingHoldExpiredBooking(booking, now = Date.now()) {
  if (!isPendingHoldTrackable(booking)) return false;
  return isPendingHoldExpired(booking.pendingExpiresAt, now);
}
