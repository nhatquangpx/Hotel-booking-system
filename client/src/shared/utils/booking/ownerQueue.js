/**
 * Hàng đợi xử lý đơn cho chủ khách sạn.
 */
import { isSameCalendarDay } from './dates';
import { getOverstayDays, isOverstayCheckout } from './checkInOut';
import {
  matchesBookingSearch,
  matchesPaymentMethodFilter,
  matchesProofFilter,
} from './search';

export function needsOwnerRefundConfirm(booking) {
  return (
    booking?.paymentStatus === 'cancelled' &&
    booking.guestCancelSnapshot?.wasPaid &&
    booking.guestCancelSnapshot?.refundPolicyEligible &&
    booking.guestCancelRequestedAt &&
    !booking.ownerRefundCompletedAt
  );
}

/**
 * Chủ KS có thể mở lại đơn đã hủy (tiền về chậm, hết hạn nhầm, …).
 * Không áp dụng đơn khách hủy sau khi đã thanh toán (luồng hoàn tiền).
 */
export function canOwnerReopenBooking(booking, referenceDate = new Date()) {
  if (!booking || booking.paymentStatus !== 'cancelled') return false;
  if (booking.guestCancelSnapshot?.wasPaid || booking.ownerRefundCompletedAt) return false;
  if (booking.checkedInAt || booking.checkedOutAt) return false;
  if (booking.checkOutDate && new Date(booking.checkOutDate).getTime() <= referenceDate.getTime()) {
    return false;
  }
  return true;
}

/** Đơn đã hủy nhưng VNPay/QR đã có tín hiệu tiền — ưu tiên mở lại. */
export function cancelledBookingHasPaymentEvidence(booking) {
  if (!booking || booking.paymentStatus !== 'cancelled') return false;
  if (booking.paymentMethod === 'vnpay' && booking.vnpayPaidAt) return true;
  if (booking.paymentMethod === 'qr_code' && booking.qrPaymentProofUrl) return true;
  return false;
}

export function needsOwnerPaymentAction(booking) {
  return booking?.paymentStatus === 'pending';
}

export function hasVnpayAwaitingOwnerVerification(booking) {
  return (
    needsOwnerPaymentAction(booking) &&
    booking.paymentMethod === 'vnpay' &&
    Boolean(booking.vnpayPaidAt) &&
    !booking.vnpayOwnerVerifiedAt
  );
}

export function hasQrProofAwaitingReview(booking) {
  return (
    needsOwnerPaymentAction(booking) &&
    booking.paymentMethod === 'qr_code' &&
    Boolean(booking.qrPaymentReportedAt) &&
    Boolean(booking.qrPaymentProofUrl)
  );
}

export function needsOwnerCheckInToday(booking, referenceDate = new Date()) {
  return (
    booking?.paymentStatus === 'paid' &&
    !booking.checkedInAt &&
    isSameCalendarDay(booking.checkInDate, referenceDate)
  );
}

export function needsOwnerCheckOutToday(booking, referenceDate = new Date()) {
  return (
    booking?.paymentStatus === 'paid' &&
    Boolean(booking.checkedInAt) &&
    !booking.checkedOutAt &&
    isSameCalendarDay(booking.checkOutDate, referenceDate)
  );
}

export { isOverstayCheckout, getOverstayDays };

export function needsOverstayCheckOut(booking, referenceDate = new Date()) {
  return (
    booking?.paymentStatus === 'paid' &&
    Boolean(booking.checkedInAt) &&
    !booking.checkedOutAt &&
    isOverstayCheckout(booking, referenceDate)
  );
}

export function needsOwnerCheckInOutToday(booking, referenceDate = new Date()) {
  return (
    needsOwnerCheckInToday(booking, referenceDate) ||
    needsOwnerCheckOutToday(booking, referenceDate) ||
    needsOverstayCheckOut(booking, referenceDate)
  );
}

export function bookingNeedsOwnerPaymentQueue(booking) {
  return needsOwnerPaymentAction(booking);
}

export function bookingNeedsOwnerRefundQueue(booking) {
  return needsOwnerRefundConfirm(booking);
}

export function bookingNeedsOwnerAction(booking, referenceDate = new Date()) {
  return (
    bookingNeedsOwnerPaymentQueue(booking) ||
    bookingNeedsOwnerRefundQueue(booking) ||
    needsOwnerCheckInOutToday(booking, referenceDate)
  );
}

export function getOwnerActionLabel(booking, referenceDate = new Date()) {
  if (hasVnpayAwaitingOwnerVerification(booking)) return 'VNPay đã thanh toán — chờ xác minh';
  if (hasQrProofAwaitingReview(booking)) return 'QR đã gửi minh chứng';
  if (needsOwnerPaymentAction(booking)) return 'Chờ xác nhận thanh toán';
  if (needsOwnerRefundConfirm(booking)) return 'Chờ hoàn tiền';
  if (needsOwnerCheckInToday(booking, referenceDate)) return 'Check-in hôm nay';
  if (needsOverstayCheckOut(booking, referenceDate)) {
    const days = getOverstayDays(booking, referenceDate);
    return `Check-out quá hạn (${days} ngày)`;
  }
  if (needsOwnerCheckOutToday(booking, referenceDate)) return 'Check-out hôm nay';
  return null;
}

export function sortOwnerBookingsByPaymentPriority(bookings) {
  return [...bookings].sort((a, b) => {
    const aVnpay = hasVnpayAwaitingOwnerVerification(a) ? 0 : 1;
    const bVnpay = hasVnpayAwaitingOwnerVerification(b) ? 0 : 1;
    if (aVnpay !== bVnpay) return aVnpay - bVnpay;
    const aProof = hasQrProofAwaitingReview(a) ? 0 : 1;
    const bProof = hasQrProofAwaitingReview(b) ? 0 : 1;
    if (aProof !== bProof) return aProof - bProof;
    return new Date(a.checkInDate) - new Date(b.checkInDate);
  });
}

export function sortOwnerBookingsByCheckIn(bookings) {
  return [...bookings].sort(
    (a, b) => new Date(a.checkInDate) - new Date(b.checkInDate)
  );
}

export function sortOwnerBookingsByCheckInOutPriority(bookings, referenceDate = new Date()) {
  return [...bookings].sort((a, b) => {
    const aCi = needsOwnerCheckInToday(a, referenceDate) ? 0 : 1;
    const bCi = needsOwnerCheckInToday(b, referenceDate) ? 0 : 1;
    if (aCi !== bCi) return aCi - bCi;
    return new Date(a.checkOutDate) - new Date(b.checkOutDate);
  });
}

export function filterOwnerPaymentQueue(bookings, { search = '', method = 'all', proof = 'all' } = {}) {
  return sortOwnerBookingsByPaymentPriority(
    bookings.filter(
      (booking) =>
        bookingNeedsOwnerPaymentQueue(booking) &&
        matchesBookingSearch(booking, search) &&
        matchesPaymentMethodFilter(booking, method) &&
        matchesProofFilter(booking, proof)
    )
  );
}

export function filterOwnerRefundQueue(bookings, { search = '', method = 'all' } = {}) {
  return sortOwnerBookingsByCheckIn(
    bookings.filter(
      (booking) =>
        bookingNeedsOwnerRefundQueue(booking) &&
        matchesBookingSearch(booking, search) &&
        matchesPaymentMethodFilter(booking, method)
    )
  );
}

export function filterOwnerCheckInOutQueue(
  bookings,
  { search = '', type = 'all' } = {},
  referenceDate = new Date()
) {
  return sortOwnerBookingsByCheckInOutPriority(
    bookings.filter((booking) => {
      if (!needsOwnerCheckInOutToday(booking, referenceDate)) return false;
      if (!matchesBookingSearch(booking, search)) return false;
      if (type === 'checkin') return needsOwnerCheckInToday(booking, referenceDate);
      if (type === 'checkout') {
        return (
          needsOwnerCheckOutToday(booking, referenceDate) ||
          needsOverstayCheckOut(booking, referenceDate)
        );
      }
      if (type === 'overstay') return needsOverstayCheckOut(booking, referenceDate);
      return true;
    }),
    referenceDate
  );
}

export function getOwnerActionCounts(bookings, referenceDate = new Date()) {
  let qrProof = 0;
  let pendingPayment = 0;
  let refund = 0;
  let checkInOut = 0;

  for (const booking of bookings) {
    if (hasVnpayAwaitingOwnerVerification(booking) || hasQrProofAwaitingReview(booking)) {
      qrProof += 1;
    } else if (needsOwnerPaymentAction(booking)) {
      pendingPayment += 1;
    } else if (needsOwnerRefundConfirm(booking)) {
      refund += 1;
    }

    if (needsOwnerCheckInOutToday(booking, referenceDate)) {
      checkInOut += 1;
    }
  }

  const paymentTotal = qrProof + pendingPayment;

  return {
    total: paymentTotal + refund + checkInOut,
    qrProof,
    pendingPayment,
    paymentTotal,
    refund,
    checkInOut,
  };
}
