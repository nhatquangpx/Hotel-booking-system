import { toast } from 'react-toastify';
import { formatDate } from '../core/format';

/** Chuẩn hoá về 00:00:00 local — đồng bộ logic server `toBookingDateOnly`. */
export function toCalendarDateOnly(dateValue) {
  const d = new Date(dateValue);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * Check-in: từ ngày nhận phòng đã đặt trở đi, trước ngày trả phòng đã đặt.
 * @returns {{ allowed: boolean, message: string }}
 */
export function getCheckInEligibility(booking, at = new Date()) {
  if (!booking?.checkInDate || !booking?.checkOutDate) {
    return { allowed: false, message: 'Đơn đặt phòng thiếu thông tin ngày lưu trú' };
  }

  const today = toCalendarDateOnly(at);
  const bookedCheckIn = toCalendarDateOnly(booking.checkInDate);
  const bookedCheckOut = toCalendarDateOnly(booking.checkOutDate);

  if (today < bookedCheckIn) {
    return {
      allowed: false,
      message: `Hôm nay chưa phải ngày check-in. Ngày nhận phòng đã đặt: ${formatDate(booking.checkInDate)}`,
    };
  }

  if (today >= bookedCheckOut) {
    return {
      allowed: false,
      message: `Không thể check-in vì đã đến hoặc qua ngày trả phòng đã đặt (${formatDate(booking.checkOutDate)})`,
    };
  }

  return { allowed: true, message: '' };
}

/**
 * Check-out: từ ngày nhận phòng đã đặt trở đi, không muộn hơn ngày trả phòng đã đặt.
 * @returns {{ allowed: boolean, message: string }}
 */
export function getCheckOutEligibility(booking, at = new Date()) {
  if (!booking?.checkInDate || !booking?.checkOutDate) {
    return { allowed: false, message: 'Đơn đặt phòng thiếu thông tin ngày lưu trú' };
  }

  const today = toCalendarDateOnly(at);
  const bookedCheckIn = toCalendarDateOnly(booking.checkInDate);
  const bookedCheckOut = toCalendarDateOnly(booking.checkOutDate);

  if (today < bookedCheckIn) {
    return {
      allowed: false,
      message: `Hôm nay chưa phải ngày check-out. Chưa đến ngày nhận phòng đã đặt (${formatDate(booking.checkInDate)})`,
    };
  }

  if (today > bookedCheckOut) {
    return {
      allowed: false,
      message: `Không thể check-out sau ngày trả phòng đã đặt (${formatDate(booking.checkOutDate)})`,
    };
  }

  return { allowed: true, message: '' };
}

export function tryOpenCheckIn(booking, onOpen) {
  const rule = getCheckInEligibility(booking);
  if (!rule.allowed) {
    toast.warn(rule.message);
    return false;
  }
  onOpen(booking);
  return true;
}

export function tryOpenCheckOut(booking, onOpen) {
  const rule = getCheckOutEligibility(booking);
  if (!rule.allowed) {
    toast.warn(rule.message);
    return false;
  }
  onOpen(booking);
  return true;
}
