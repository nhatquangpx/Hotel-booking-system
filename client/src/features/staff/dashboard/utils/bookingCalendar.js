import { formatYmd, isSameCalendarDay } from './calendarDate';

/** Lịch chỉ hiển thị đơn đã thanh toán — khớp metric dashboard. */
export function isCalendarEligibleBooking(booking) {
  return booking?.paymentStatus === 'paid';
}

export function filterCalendarBookings(bookings) {
  return (bookings || []).filter(isCalendarEligibleBooking);
}

export function getDayBookingEvents(booking, day) {
  const events = [];
  if (isSameCalendarDay(booking.checkInDate, day)) events.push('checkin');
  if (isSameCalendarDay(booking.checkOutDate, day)) events.push('checkout');
  return events;
}

const EVENT_LABELS = {
  checkin: 'Check-in',
  checkout: 'Check-out',
};

export function formatDayEvent(eventType) {
  return EVENT_LABELS[eventType] || eventType;
}

export function formatDayEvents(events) {
  return events.map((e) => EVENT_LABELS[e] || e).join(' · ');
}

/** Nhãn gọn trên ô ngày: «2 CI», «1 CO» hoặc «1 CI · 1 CO». */
export function formatDaySummaryLabel(summary) {
  if (!summary?.total) return '';

  const parts = [];
  if (summary.checkin > 0) parts.push(`${summary.checkin} CI`);
  if (summary.checkout > 0) parts.push(`${summary.checkout} CO`);
  return parts.join(' · ');
}

function compareRoomNumber(a, b) {
  const roomA = a?.room?.roomNumber;
  const roomB = b?.room?.roomNumber;
  const numA = Number(roomA);
  const numB = Number(roomB);

  if (!Number.isNaN(numA) && !Number.isNaN(numB) && roomA !== '' && roomB !== '') {
    return numA - numB;
  }

  return String(roomA ?? '').localeCompare(String(roomB ?? ''), 'vi', { numeric: true });
}

/**
 * Mỗi dòng = một sự kiện (check-in hoặc check-out) trong ngày.
 * Cùng đơn có cả hai trong một ngày sẽ tách thành 2 dòng.
 */
export function getDayBookingRows(bookings, day) {
  const rows = [];

  for (const booking of bookings) {
    if (isSameCalendarDay(booking.checkInDate, day)) {
      rows.push({
        booking,
        eventType: 'checkin',
        rowKey: `${booking._id}-checkin`,
      });
    }
    if (isSameCalendarDay(booking.checkOutDate, day)) {
      rows.push({
        booking,
        eventType: 'checkout',
        rowKey: `${booking._id}-checkout`,
      });
    }
  }

  rows.sort((a, b) => {
    if (a.eventType !== b.eventType) {
      return a.eventType === 'checkin' ? -1 : 1;
    }

    const roomCmp = compareRoomNumber(a.booking, b.booking);
    if (roomCmp !== 0) return roomCmp;

    return String(a.booking.guest?.name || '').localeCompare(
      String(b.booking.guest?.name || ''),
      'vi'
    );
  });

  return rows;
}

export function getBookingsForDay(bookings, day) {
  const seen = new Set();
  const result = [];

  for (const row of getDayBookingRows(bookings, day)) {
    if (seen.has(row.booking._id)) continue;
    seen.add(row.booking._id);
    result.push(row.booking);
  }

  return result;
}

export function getDaySummary(bookings, day) {
  const rows = getDayBookingRows(bookings, day);

  return {
    total: rows.length,
    checkin: rows.filter((row) => row.eventType === 'checkin').length,
    checkout: rows.filter((row) => row.eventType === 'checkout').length,
  };
}

export function buildDaySummaryMap(bookings, days) {
  const map = {};
  for (const day of days) {
    map[formatYmd(day)] = getDaySummary(bookings, day);
  }
  return map;
}

export function getStaffBookingDisplayStatus(booking) {
  if (booking.checkedOutAt) {
    return { label: 'Đã trả phòng', tone: 'checked-out' };
  }
  if (booking.checkedInAt) {
    return { label: 'Đã nhận phòng', tone: 'checked-in' };
  }
  if (booking.paymentStatus === 'paid') {
    return { label: 'Đã thanh toán', tone: 'confirmed' };
  }
  if (booking.paymentStatus === 'pending') {
    const label =
      booking.paymentMethod === 'qr_code' && booking.qrPaymentReportedAt
        ? 'Chờ xác nhận thanh toán'
        : 'Chờ thanh toán';
    return { label, tone: 'pending' };
  }
  if (booking.paymentStatus === 'cancelled') {
    return { label: 'Đã hủy', tone: 'cancelled' };
  }
  return { label: 'Không xác định', tone: 'default' };
}
