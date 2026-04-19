const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(utc);
dayjs.extend(timezone);

const REPORT_TZ = 'Asia/Ho_Chi_Minh';
const MAX_RANGE_DAYS = 366;

/**
 * Khoảng [fromStr, toStr] theo lịch REPORT_TZ → Date UTC cho MongoDB.
 * @param {string} fromStr YYYY-MM-DD
 * @param {string} toStr YYYY-MM-DD
 */
function parseInclusiveRange(fromStr, toStr) {
  if (!fromStr || !toStr) {
    const err = new Error('Thiếu tham số from hoặc to (định dạng YYYY-MM-DD)');
    err.statusCode = 400;
    throw err;
  }

  const from = dayjs.tz(`${fromStr}T00:00:00`, REPORT_TZ);
  const to = dayjs.tz(`${toStr}T00:00:00`, REPORT_TZ);

  if (!from.isValid() || !to.isValid()) {
    const err = new Error('Ngày không hợp lệ (dùng YYYY-MM-DD)');
    err.statusCode = 400;
    throw err;
  }
  if (to.isBefore(from)) {
    const err = new Error('Ngày kết thúc phải sau hoặc bằng ngày bắt đầu');
    err.statusCode = 400;
    throw err;
  }

  const endExclusive = to.add(1, 'day').startOf('day');
  const days = endExclusive.diff(from, 'day');

  if (days > MAX_RANGE_DAYS) {
    const err = new Error(`Khoảng thời gian tối đa ${MAX_RANGE_DAYS} ngày`);
    err.statusCode = 400;
    throw err;
  }

  return {
    rangeStart: from.toDate(),
    rangeEndExclusive: endExclusive.toDate(),
    days
  };
}

function startOfDayReportTz(dateLike) {
  return dayjs(dateLike).tz(REPORT_TZ).startOf('day');
}

/** Mỗi ngày lịch trong [rangeStart, rangeEndExclusive), gọi fn(ymd, dayjsCursor) */
function forEachReportDay(rangeStart, rangeEndExclusive, fn) {
  let cursor = startOfDayReportTz(rangeStart);
  const end = startOfDayReportTz(rangeEndExclusive);
  while (cursor.isBefore(end)) {
    fn(cursor.format('YYYY-MM-DD'), cursor);
    cursor = cursor.add(1, 'day');
  }
}

module.exports = {
  REPORT_TZ,
  parseInclusiveRange,
  startOfDayReportTz,
  forEachReportDay
};
