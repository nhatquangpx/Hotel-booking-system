/**
 * Hàng đợi check-in / check-out cho nhân viên lễ tân.
 */
import {
  needsOwnerCheckInToday,
  needsOwnerCheckOutToday,
  needsOwnerCheckInOutToday,
} from './ownerBookingQueue';

export const needsStaffCheckInToday = needsOwnerCheckInToday;
export const needsStaffCheckOutToday = needsOwnerCheckOutToday;
export const bookingNeedsStaffAction = needsOwnerCheckInOutToday;

export function getStaffActionLabel(booking, referenceDate = new Date()) {
  if (needsStaffCheckInToday(booking, referenceDate)) return 'Check-in hôm nay';
  if (needsStaffCheckOutToday(booking, referenceDate)) return 'Check-out hôm nay';
  return null;
}

export function getStaffActionCounts(bookings, referenceDate = new Date()) {
  let checkIn = 0;
  let checkOut = 0;

  for (const booking of bookings) {
    if (needsStaffCheckInToday(booking, referenceDate)) checkIn += 1;
    if (needsStaffCheckOutToday(booking, referenceDate)) checkOut += 1;
  }

  return {
    total: checkIn + checkOut,
    checkIn,
    checkOut,
  };
}
