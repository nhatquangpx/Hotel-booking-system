/**
 * Hàng đợi check-in / check-out cho nhân viên lễ tân.
 */
import {
  needsOwnerCheckInToday,
  needsOwnerCheckOutToday,
  needsOverstayCheckOut,
  needsOwnerCheckInOutToday,
  getOverstayDays,
} from './ownerQueue';

export const needsStaffCheckInToday = needsOwnerCheckInToday;
export const needsStaffCheckOutToday = needsOwnerCheckOutToday;
export { needsOverstayCheckOut, getOverstayDays };
export const bookingNeedsStaffAction = needsOwnerCheckInOutToday;

export function getStaffActionLabel(booking, referenceDate = new Date()) {
  if (needsStaffCheckInToday(booking, referenceDate)) return 'Check-in hôm nay';
  if (needsOverstayCheckOut(booking, referenceDate)) {
    const days = getOverstayDays(booking, referenceDate);
    return `Check-out quá hạn (${days} ngày)`;
  }
  if (needsStaffCheckOutToday(booking, referenceDate)) return 'Check-out hôm nay';
  return null;
}

export function getStaffActionCounts(bookings, referenceDate = new Date()) {
  let checkIn = 0;
  let checkOut = 0;
  let overstay = 0;

  for (const booking of bookings) {
    if (needsStaffCheckInToday(booking, referenceDate)) checkIn += 1;
    if (needsOverstayCheckOut(booking, referenceDate)) overstay += 1;
    else if (needsStaffCheckOutToday(booking, referenceDate)) checkOut += 1;
  }

  return {
    total: checkIn + checkOut + overstay,
    checkIn,
    checkOut,
    overstay,
  };
}
