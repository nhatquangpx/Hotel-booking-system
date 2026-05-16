/** So sánh theo ngày lịch (local), bỏ qua giờ. */
export function isSameCalendarDay(dateValue, referenceDate = new Date()) {
  if (!dateValue) return false;
  const d = new Date(dateValue);
  const ref = new Date(referenceDate);
  return (
    d.getFullYear() === ref.getFullYear() &&
    d.getMonth() === ref.getMonth() &&
    d.getDate() === ref.getDate()
  );
}

/** Đơn có lịch nhận phòng hoặc trả phòng vào hôm nay. */
export function isTodayCheckInOrCheckOut(booking, referenceDate = new Date()) {
  return (
    isSameCalendarDay(booking.checkInDate, referenceDate) ||
    isSameCalendarDay(booking.checkOutDate, referenceDate)
  );
}
