/** X: số ngày tối thiểu trước ngày nhận phòng — ngưỡng chính sách cho đơn đã thanh toán khi xét hoàn tiền (đồng bộ server). */
export const DEFAULT_REFUND_MIN_DAYS_BEFORE_CHECKIN = 2;

export function getEffectiveRefundMinDaysBeforeCheckIn(policies) {
  const raw = policies?.refundMinDaysBeforeCheckIn;
  if (raw === undefined || raw === null || raw === '') {
    return DEFAULT_REFUND_MIN_DAYS_BEFORE_CHECKIN;
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return DEFAULT_REFUND_MIN_DAYS_BEFORE_CHECKIN;
  }
  return Math.min(90, Math.floor(n));
}

/**
 * Đơn đã thanh toán có đủ ngày trước check-in theo chính sách hoàn (đồng bộ logic server).
 * @returns {{ eligible: boolean, minNoticeDays: number, daysUntilCheckIn: number }}
 */
export function computeGuestRefundEligibility(booking) {
  if (!booking || booking.paymentStatus !== 'paid') {
    return { eligible: false, minNoticeDays: 0, daysUntilCheckIn: 0 };
  }
  const minNoticeDays = getEffectiveRefundMinDaysBeforeCheckIn(booking.hotel?.policies || {});
  const checkInDate = new Date(booking.checkInDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  checkInDate.setHours(0, 0, 0, 0);
  const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));
  return {
    eligible: daysUntilCheckIn >= minNoticeDays,
    minNoticeDays,
    daysUntilCheckIn,
  };
}
