const Hotel = require('../../models/Hotel');
const { isValidObjectId } = require('../../lib/ids/mongooseIds');
const Room = require('../../models/Room');
const { getScopedHotelIdsForOwner } = require('../dashboards/core');
const { buildReportExcelBuffer } = require('./reportExcel');
const { parseInclusiveRange, forEachReportDay } = require('./reportTz');
const { aggregateRoomNightStats } = require('./roomNightsAggregate');
const {
  aggregateStayRevenueStats,
  aggregateStayRevenueByRoomType,
  aggregateBookingsCreatedByDay,
} = require('./stayRevenueAggregate');
const { ROOM_TYPE_ORDER, formatRoomTypeVi } = require('../rooms/roomTypes');

const getScopedHotelIdsForAdmin = async (hotelId) => {
  if (!hotelId) {
    const all = await Hotel.find().select('_id').lean();
    return all.map((h) => h._id);
  }
  if (!isValidObjectId(hotelId)) {
    const err = new Error('hotelId không hợp lệ');
    err.statusCode = 400;
    throw err;
  }
  const h = await Hotel.findById(hotelId).select('_id name').lean();
  if (!h) {
    const err = new Error('Không tìm thấy khách sạn');
    err.statusCode = 404;
    throw err;
  }
  return [h._id];
};

const getHotelLabel = async (hotelIds) => {
  if (hotelIds.length === 0) return '—';
  const hotels = await Hotel.find({ _id: { $in: hotelIds } })
    .select('name')
    .lean();
  const names = hotels.map((h) => h.name).filter(Boolean);
  if (names.length === 0) return '—';
  if (names.length === 1) return names[0];
  return `Nhiều khách sạn (${names.length})`;
};

const countDaysInRange = (rangeStart, rangeEndExclusive) => {
  let n = 0;
  forEachReportDay(rangeStart, rangeEndExclusive, () => {
    n += 1;
  });
  return n;
};

const buildDailyRows = (stayStats, nightMap, createdMap, rangeStart, rangeEndExclusive) => {
  const rows = [];
  forEachReportDay(rangeStart, rangeEndExclusive, (key) => {
    const created = createdMap.get(key) || { count: 0, paidCount: 0, cancelledCount: 0 };
    const revenue = stayStats.revenueMap.get(key) || 0;
    const roomNights = nightMap.get(key) || 0;
    rows.push({
      dateLabel: key,
      revenue,
      bookingsCreated: stayStats.bookingsMap.get(key) || 0,
      roomNights,
      adr: roomNights > 0 ? revenue / roomNights : 0,
      newBookings: created.count,
      newPaidBookings: created.paidCount,
      newCancelledBookings: created.cancelledCount,
    });
  });
  return rows;
};

const buildByRoomTypeRows = async (hotelIds, rangeStart, rangeEndExclusive, daysInRange) => {
  const [typeStats, rooms] = await Promise.all([
    aggregateStayRevenueByRoomType(hotelIds, rangeStart, rangeEndExclusive),
    Room.find({ hotelId: { $in: hotelIds } }).select('type roomStatus').lean(),
  ]);

  const roomCountByType = new Map();
  const activeCountByType = new Map();
  for (const r of rooms) {
    const t = r.type || 'unknown';
    roomCountByType.set(t, (roomCountByType.get(t) || 0) + 1);
    if (r.roomStatus === 'active') {
      activeCountByType.set(t, (activeCountByType.get(t) || 0) + 1);
    }
  }

  const statsByType = new Map(typeStats.map((s) => [s.roomType, s]));
  const allTypes = new Set([
    ...ROOM_TYPE_ORDER,
    ...roomCountByType.keys(),
    ...statsByType.keys(),
  ]);

  const ordered = [
    ...ROOM_TYPE_ORDER.filter((t) => allTypes.has(t)),
    ...[...allTypes].filter((t) => !ROOM_TYPE_ORDER.includes(t)),
  ];

  return ordered
    .filter((t) => (roomCountByType.get(t) || 0) > 0 || statsByType.has(t))
    .map((type) => {
      const s = statsByType.get(type) || {
        revenue: 0,
        roomNights: 0,
        bookingCount: 0,
      };
      const roomCount = roomCountByType.get(type) || 0;
      const activeRooms = activeCountByType.get(type) || 0;
      const capacity = activeRooms * daysInRange;
      const occupancyRate =
        capacity > 0
          ? Math.min(100, Math.round((s.roomNights / capacity) * 1000) / 10)
          : 0;
      const adr = s.roomNights > 0 ? s.revenue / s.roomNights : 0;
      const revpar = capacity > 0 ? s.revenue / capacity : 0;

      return {
        roomType: type,
        roomTypeLabel: formatRoomTypeVi(type),
        roomCount,
        activeRooms,
        bookingCount: s.bookingCount,
        roomNights: s.roomNights,
        revenue: s.revenue,
        occupancyRate,
        adr,
        revpar,
        revenueShare: 0,
      };
    });
};

const buildReportPayload = async (hotelIds, rangeStart, rangeEndExclusive) => {
  if (hotelIds.length === 0) {
    return {
      hotelLabel: '—',
      totalRooms: 0,
      activeRooms: 0,
      totalRevenue: 0,
      bookingCount: 0,
      totalRoomNightsSold: 0,
      daysInRange: 0,
      occupancyRate: 0,
      adr: 0,
      revpar: 0,
      daily: [],
      byRoomType: [],
    };
  }

  const daysInRange = countDaysInRange(rangeStart, rangeEndExclusive);

  const [
    totalRooms,
    activeRooms,
    hotelLabel,
    stayStats,
    roomStats,
    createdMap,
  ] = await Promise.all([
    Room.countDocuments({ hotelId: { $in: hotelIds } }),
    Room.countDocuments({ hotelId: { $in: hotelIds }, roomStatus: 'active' }),
    getHotelLabel(hotelIds),
    aggregateStayRevenueStats(hotelIds, rangeStart, rangeEndExclusive),
    aggregateRoomNightStats(hotelIds, rangeStart, rangeEndExclusive),
    aggregateBookingsCreatedByDay(hotelIds, rangeStart, rangeEndExclusive),
  ]);

  const daily = buildDailyRows(
    stayStats,
    roomStats.nightMap,
    createdMap,
    rangeStart,
    rangeEndExclusive
  );

  const byRoomType = await buildByRoomTypeRows(
    hotelIds,
    rangeStart,
    rangeEndExclusive,
    daysInRange
  );

  const capacity = activeRooms * daysInRange;
  const totalRevenue = stayStats.totalRevenue;
  const totalRoomNightsSold = roomStats.totalRoomNights;
  const occupancyRate =
    capacity > 0
      ? Math.min(100, Math.round((totalRoomNightsSold / capacity) * 1000) / 10)
      : 0;
  const adr = totalRoomNightsSold > 0 ? totalRevenue / totalRoomNightsSold : 0;
  const revpar = capacity > 0 ? totalRevenue / capacity : 0;

  const revenueSum = byRoomType.reduce((s, r) => s + r.revenue, 0);
  for (const row of byRoomType) {
    row.revenueShare =
      revenueSum > 0 ? Math.round((row.revenue / revenueSum) * 1000) / 10 : 0;
  }

  return {
    hotelLabel,
    totalRooms,
    activeRooms,
    totalRevenue,
    bookingCount: stayStats.bookingCount,
    totalRoomNightsSold,
    daysInRange,
    occupancyRate,
    adr,
    revpar,
    daily,
    byRoomType,
  };
};

const getOwnerReportExcel = async (ownerId, hotelId, fromStr, toStr) => {
  const { rangeStart, rangeEndExclusive } = parseInclusiveRange(fromStr, toStr);
  const hotelIds = await getScopedHotelIdsForOwner(ownerId, hotelId || null);
  const payload = await buildReportPayload(hotelIds, rangeStart, rangeEndExclusive);
  const meta = { title: 'Owner', fromStr, toStr };

  const buffer = await buildReportExcelBuffer(payload, meta);
  return {
    body: Buffer.from(buffer),
    filename: `bao-cao-owner-${fromStr}_${toStr}.xlsx`,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

const getAdminReportExcel = async (hotelId, fromStr, toStr) => {
  const { rangeStart, rangeEndExclusive } = parseInclusiveRange(fromStr, toStr);
  const hotelIds = await getScopedHotelIdsForAdmin(hotelId || null);
  const payload = await buildReportPayload(hotelIds, rangeStart, rangeEndExclusive);
  const meta = { title: 'Admin', fromStr, toStr };

  const buffer = await buildReportExcelBuffer(payload, meta);
  return {
    body: Buffer.from(buffer),
    filename: `bao-cao-admin-${fromStr}_${toStr}.xlsx`,
    contentType:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
};

module.exports = {
  getOwnerReportExcel,
  getAdminReportExcel,
  parseInclusiveRange,
};
