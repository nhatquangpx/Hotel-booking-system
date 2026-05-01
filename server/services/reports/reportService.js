const mongoose = require('mongoose');
const Hotel = require('../../models/Hotel');
const { isValidObjectId } = require('../../utils/mongooseIds');
const Booking = require('../../models/Booking');
const Room = require('../../models/Room');
const { getScopedHotelIdsForOwner, calculateRevenueInRange } = require('../dashboards/core');
const { buildReportExcelBuffer } = require('./reportExcel');
const { REPORT_TZ, parseInclusiveRange, forEachReportDay } = require('./reportTz');
const { aggregateRoomNightStats } = require('./roomNightsAggregate');

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

const countPaidBookingsCreatedInRange = async (hotelIds, rangeStart, rangeEndExclusive) => {
  if (hotelIds.length === 0) return 0;
  return Booking.countDocuments({
    hotel: { $in: hotelIds },
    paymentStatus: 'paid',
    createdAt: { $gte: rangeStart, $lt: rangeEndExclusive }
  });
};

const aggregateDailyRevenueAndBookings = async (hotelIds, rangeStart, rangeEndExclusive) => {
  const map = new Map();
  if (hotelIds.length === 0) return map;

  const rows = await Booking.aggregate([
    {
      $match: {
        hotel: { $in: hotelIds },
        paymentStatus: 'paid',
        createdAt: { $gte: rangeStart, $lt: rangeEndExclusive }
      }
    },
    {
      $group: {
        _id: {
          $dateToString: { format: '%Y-%m-%d', date: '$createdAt', timezone: REPORT_TZ }
        },
        revenue: { $sum: '$totalAmount' },
        bookingsCreated: { $sum: 1 }
      }
    }
  ]);

  for (const r of rows) {
    map.set(r._id, { revenue: r.revenue, bookingsCreated: r.bookingsCreated });
  }
  return map;
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

const buildDailyRows = (revBookMap, nightMap, rangeStart, rangeEndExclusive) => {
  const rows = [];
  forEachReportDay(rangeStart, rangeEndExclusive, (key) => {
    const rb = revBookMap.get(key) || { revenue: 0, bookingsCreated: 0 };
    const roomNights = nightMap.get(key) || 0;
    rows.push({
      dateLabel: key,
      revenue: rb.revenue,
      bookingsCreated: rb.bookingsCreated,
      roomNights
    });
  });
  return rows;
};

const buildReportPayload = async (hotelIds, rangeStart, rangeEndExclusive) => {
  if (hotelIds.length === 0) {
    return {
      hotelLabel: '—',
      totalRooms: 0,
      totalRevenue: 0,
      bookingCount: 0,
      totalRoomNightsSold: 0,
      daily: []
    };
  }

  const [
    totalRooms,
    totalRevenue,
    bookingCount,
    hotelLabel,
    revBookMap,
    roomStats
  ] = await Promise.all([
    Room.countDocuments({ hotelId: { $in: hotelIds } }),
    calculateRevenueInRange(hotelIds, rangeStart, rangeEndExclusive),
    countPaidBookingsCreatedInRange(hotelIds, rangeStart, rangeEndExclusive),
    getHotelLabel(hotelIds),
    aggregateDailyRevenueAndBookings(hotelIds, rangeStart, rangeEndExclusive),
    aggregateRoomNightStats(hotelIds, rangeStart, rangeEndExclusive)
  ]);

  const daily = buildDailyRows(revBookMap, roomStats.nightMap, rangeStart, rangeEndExclusive);

  return {
    hotelLabel,
    totalRooms,
    totalRevenue,
    bookingCount,
    totalRoomNightsSold: roomStats.totalRoomNights,
    daily
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
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
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  };
};

module.exports = {
  getOwnerReportExcel,
  getAdminReportExcel,
  parseInclusiveRange
};
