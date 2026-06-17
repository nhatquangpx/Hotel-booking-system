/** Tiện ích ngày cho lịch dashboard staff (local calendar day). */

export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function formatYmd(date) {
  const d = startOfDay(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isSameCalendarDay(a, b) {
  if (!a || !b) return false;
  return formatYmd(a) === formatYmd(b);
}

export function isToday(date) {
  return isSameCalendarDay(date, new Date());
}

/** Thứ Hai là ngày đầu tuần. */
export function getWeekDays(anchorDate) {
  const start = startOfDay(anchorDate);
  const weekday = start.getDay();
  const mondayOffset = weekday === 0 ? -6 : 1 - weekday;
  start.setDate(start.getDate() + mondayOffset);

  return Array.from({ length: 7 }, (_, i) => {
    const day = new Date(start);
    day.setDate(start.getDate() + i);
    return day;
  });
}

/** Lưới tháng: đủ hàng tuần (4–6), bắt đầu từ Thứ Hai. */
export function getMonthGrid(anchorDate) {
  const year = anchorDate.getFullYear();
  const month = anchorDate.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let startPad = firstOfMonth.getDay();
  startPad = startPad === 0 ? 6 : startPad - 1;

  const totalCells = Math.ceil((startPad + daysInMonth) / 7) * 7;
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(gridStart.getDate() - startPad);

  return Array.from({ length: totalCells }, (_, i) => {
    const day = new Date(gridStart);
    day.setDate(gridStart.getDate() + i);
    return day;
  });
}

export function addDays(date, amount) {
  const d = new Date(date);
  d.setDate(d.getDate() + amount);
  return d;
}

export function addMonths(date, amount) {
  const d = new Date(date);
  d.setMonth(d.getMonth() + amount);
  return d;
}

export const WEEKDAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];

export const WEEKDAY_LABELS_FULL = [
  'Thứ Hai',
  'Thứ Ba',
  'Thứ Tư',
  'Thứ Năm',
  'Thứ Sáu',
  'Thứ Bảy',
  'Chủ Nhật',
];

export function getWeekdayLabel(day, full = false) {
  const weekday = day.getDay();
  const index = weekday === 0 ? 6 : weekday - 1;
  return full ? WEEKDAY_LABELS_FULL[index] : WEEKDAY_LABELS[index];
}

export function formatMonthYear(date) {
  return date.toLocaleDateString('vi-VN', { month: 'long', year: 'numeric' });
}

export function formatWeekRange(weekDays) {
  if (!weekDays?.length) return '';
  const first = weekDays[0];
  const last = weekDays[weekDays.length - 1];
  const sameMonth = first.getMonth() === last.getMonth();
  const sameYear = first.getFullYear() === last.getFullYear();

  if (sameMonth && sameYear) {
    return `${first.getDate()} – ${last.getDate()} tháng ${first.getMonth() + 1}, ${first.getFullYear()}`;
  }

  if (sameYear) {
    return `${first.getDate()}/${first.getMonth() + 1} – ${last.getDate()}/${last.getMonth() + 1}, ${first.getFullYear()}`;
  }

  return `${formatShortDate(first)} – ${formatShortDate(last)}`;
}

export function formatShortDate(date) {
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

export function formatFullDate(date) {
  return date.toLocaleDateString('vi-VN', {
    weekday: 'long',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
