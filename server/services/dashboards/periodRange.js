const { startOfDayReportTz, REPORT_TZ } = require('../reports/reportTz');
const { ServiceError } = require('../../lib/http/serviceError');

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const VALID_PERIODS = ['week', 'month', 'year'];

const MONTH_LABELS = [
  'Thg 1',
  'Thg 2',
  'Thg 3',
  'Thg 4',
  'Thg 5',
  'Thg 6',
  'Thg 7',
  'Thg 8',
  'Thg 9',
  'Thg 10',
  'Thg 11',
  'Thg 12',
];

/**
 * @param {string} period week|month|year
 * @param {number|string} offset số kỳ lùi (≥ 0)
 */
function normalizePeriodOffset(period, offset) {
  const p = String(period || 'week').toLowerCase();
  if (!VALID_PERIODS.includes(p)) {
    throw new ServiceError(400, 'period phải là week, month hoặc year');
  }
  const o = Math.max(0, Math.floor(Number(offset) || 0));
  if (!Number.isFinite(o) || o > 120) {
    throw new ServiceError(400, 'offset không hợp lệ');
  }
  return { period: p, offset: o };
}

/**
 * Khoảng [rangeStart, rangeEndExclusive) theo Asia/Ho_Chi_Minh.
 * - week: cửa sổ 7 ngày; offset=0 kết thúc hôm nay
 * - month: tháng lịch; offset=0 từ đầu tháng → hết hôm nay
 * - year: năm lịch; offset=0 từ 1/1 → hết hôm nay (bucket theo tháng)
 */
function resolveChartPeriodRange(periodInput, offsetInput) {
  const { period, offset } = normalizePeriodOffset(periodInput, offsetInput);
  const today = startOfDayReportTz();
  const tomorrow = today.add(1, 'day');

  if (period === 'week') {
    const rangeEndExclusive = tomorrow.subtract(offset * 7, 'day');
    const rangeStart = rangeEndExclusive.subtract(7, 'day');
    const fromStr = rangeStart.format('YYYY-MM-DD');
    const toStr = rangeEndExclusive.subtract(1, 'day').format('YYYY-MM-DD');
    return {
      period,
      offset,
      bucket: 'day',
      rangeStart: rangeStart.toDate(),
      rangeEndExclusive: rangeEndExclusive.toDate(),
      fromStr,
      toStr,
      label: `${rangeStart.format('DD/MM/YYYY')} – ${rangeEndExclusive.subtract(1, 'day').format('DD/MM/YYYY')}`,
      canGoNext: offset > 0,
    };
  }

  if (period === 'month') {
    const monthCursor = today.startOf('month').subtract(offset, 'month');
    const rangeStart = monthCursor;
    const monthEndExclusive = monthCursor.add(1, 'month');
    const rangeEndExclusive = offset === 0 ? tomorrow : monthEndExclusive;
    const fromStr = rangeStart.format('YYYY-MM-DD');
    const toStr = rangeEndExclusive.subtract(1, 'day').format('YYYY-MM-DD');
    return {
      period,
      offset,
      bucket: 'day',
      rangeStart: rangeStart.toDate(),
      rangeEndExclusive: rangeEndExclusive.toDate(),
      fromStr,
      toStr,
      label: `Tháng ${rangeStart.format('M/YYYY')}${offset === 0 ? ' (đến hôm nay)' : ''}`,
      canGoNext: offset > 0,
    };
  }

  // year
  const yearCursor = today.startOf('year').subtract(offset, 'year');
  const rangeStart = yearCursor;
  const yearEndExclusive = yearCursor.add(1, 'year');
  const rangeEndExclusive = offset === 0 ? tomorrow : yearEndExclusive;
  const fromStr = rangeStart.format('YYYY-MM-DD');
  const toStr = rangeEndExclusive.subtract(1, 'day').format('YYYY-MM-DD');
  return {
    period,
    offset,
    bucket: 'month',
    rangeStart: rangeStart.toDate(),
    rangeEndExclusive: rangeEndExclusive.toDate(),
    fromStr,
    toStr,
    label: `Năm ${rangeStart.format('YYYY')}${offset === 0 ? ' (đến hôm nay)' : ''}`,
    canGoNext: offset > 0,
  };
}

/**
 * Ghép map YYYY-MM-DD → số thành series theo bucket day|month.
 */
function buildPeriodSeries(rangeMeta, valueMap) {
  const dayjs = require('dayjs');
  const utc = require('dayjs/plugin/utc');
  const timezone = require('dayjs/plugin/timezone');
  dayjs.extend(utc);
  dayjs.extend(timezone);

  let cursor = dayjs(rangeMeta.rangeStart).tz(REPORT_TZ).startOf('day');
  const end = dayjs(rangeMeta.rangeEndExclusive).tz(REPORT_TZ).startOf('day');

  if (rangeMeta.bucket === 'month') {
    const monthTotals = new Map();
    while (cursor.isBefore(end)) {
      const mk = cursor.format('YYYY-MM');
      const dk = cursor.format('YYYY-MM-DD');
      monthTotals.set(mk, (monthTotals.get(mk) || 0) + (valueMap.get(dk) || 0));
      cursor = cursor.add(1, 'day');
    }

    const series = [];
    let mCursor = dayjs(rangeMeta.rangeStart).tz(REPORT_TZ).startOf('month');
    const mEnd = dayjs(rangeMeta.rangeEndExclusive).tz(REPORT_TZ).startOf('day');
    while (mCursor.isBefore(mEnd)) {
      const mk = mCursor.format('YYYY-MM');
      series.push({
        key: mk,
        label: MONTH_LABELS[mCursor.month()],
        value: monthTotals.get(mk) || 0,
      });
      mCursor = mCursor.add(1, 'month');
    }
    return series;
  }

  const series = [];
  while (cursor.isBefore(end)) {
    const key = cursor.format('YYYY-MM-DD');
    const label =
      rangeMeta.period === 'week'
        ? DAYS_OF_WEEK[cursor.day()]
        : cursor.format('DD/MM');
    series.push({
      key,
      label,
      value: valueMap.get(key) || 0,
    });
    cursor = cursor.add(1, 'day');
  }
  return series;
}

/**
 * Công suất % theo bucket: đêm bán / (số phòng × số ngày trong bucket).
 */
function buildOccupancySeries(rangeMeta, nightMap, roomCount) {
  const dayjs = require('dayjs');
  const utc = require('dayjs/plugin/utc');
  const timezone = require('dayjs/plugin/timezone');
  dayjs.extend(utc);
  dayjs.extend(timezone);

  const denomRooms = Math.max(0, roomCount || 0);

  if (rangeMeta.bucket === 'month') {
    const nightsByMonth = new Map();
    const daysByMonth = new Map();
    let cursor = dayjs(rangeMeta.rangeStart).tz(REPORT_TZ).startOf('day');
    const end = dayjs(rangeMeta.rangeEndExclusive).tz(REPORT_TZ).startOf('day');
    while (cursor.isBefore(end)) {
      const mk = cursor.format('YYYY-MM');
      const dk = cursor.format('YYYY-MM-DD');
      nightsByMonth.set(mk, (nightsByMonth.get(mk) || 0) + (nightMap.get(dk) || 0));
      daysByMonth.set(mk, (daysByMonth.get(mk) || 0) + 1);
      cursor = cursor.add(1, 'day');
    }

    const series = [];
    let mCursor = dayjs(rangeMeta.rangeStart).tz(REPORT_TZ).startOf('month');
    const mEnd = dayjs(rangeMeta.rangeEndExclusive).tz(REPORT_TZ).startOf('day');
    while (mCursor.isBefore(mEnd)) {
      const mk = mCursor.format('YYYY-MM');
      const nights = nightsByMonth.get(mk) || 0;
      const days = daysByMonth.get(mk) || 0;
      const capacity = denomRooms * days;
      const rate =
        capacity > 0 ? Math.min(100, Math.round((nights / capacity) * 100)) : 0;
      series.push({
        key: mk,
        label: MONTH_LABELS[mCursor.month()],
        value: rate,
        roomNights: nights,
        capacity,
      });
      mCursor = mCursor.add(1, 'month');
    }
    return series;
  }

  const series = [];
  let cursor = dayjs(rangeMeta.rangeStart).tz(REPORT_TZ).startOf('day');
  const end = dayjs(rangeMeta.rangeEndExclusive).tz(REPORT_TZ).startOf('day');
  while (cursor.isBefore(end)) {
    const key = cursor.format('YYYY-MM-DD');
    const nights = nightMap.get(key) || 0;
    const rate =
      denomRooms > 0
        ? Math.min(100, Math.round((Math.min(nights, denomRooms) / denomRooms) * 100))
        : 0;
    const label =
      rangeMeta.period === 'week'
        ? DAYS_OF_WEEK[cursor.day()]
        : cursor.format('DD/MM');
    series.push({
      key,
      label,
      value: rate,
      roomNights: nights,
      capacity: denomRooms,
    });
    cursor = cursor.add(1, 'day');
  }
  return series;
}

module.exports = {
  DAYS_OF_WEEK,
  VALID_PERIODS,
  normalizePeriodOffset,
  resolveChartPeriodRange,
  buildPeriodSeries,
  buildOccupancySeries,
};
