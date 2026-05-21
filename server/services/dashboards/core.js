const Hotel = require('../../models/Hotel');
const Room = require('../../models/Room');
const Booking = require('../../models/Booking');
const { startOfDayReportTz, REPORT_TZ } = require('../reports/reportTz');

/**
 * Dashboard Core Service
 * Shared helper functions for dashboard services
 * Mốc ngày «hôm nay» theo Asia/Ho_Chi_Minh (khớp report/sale VN).
 */

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const DASHBOARD_TZ = REPORT_TZ;

/**
 * Get all hotel IDs for an owner
 * @param {String} ownerId - Owner user ID
 * @returns {Promise<Array>} Array of hotel ObjectIds
 */
const getOwnerHotelIds = async (ownerId) => {
  const ownerHotels = await Hotel.find({ ownerId }).select('_id');
  return ownerHotels.map(hotel => hotel._id);
};

/**
 * Danh sách khách sạn dùng cho thống kê/lọc: tất cả của owner, hoặc một khách sạn nếu hợp lệ.
 * @param {String|null|undefined} hotelId - optional, phải thuộc owner
 */
const getScopedHotelIdsForOwner = async (ownerId, hotelId) => {
  const allIds = await getOwnerHotelIds(ownerId);
  if (allIds.length === 0) return [];
  if (!hotelId) return allIds;
  const sid = String(hotelId);
  const match = allIds.find((id) => id.toString() === sid);
  if (!match) {
    const err = new Error('Khách sạn không thuộc tài khoản của bạn');
    err.statusCode = 403;
    throw err;
  }
  return [match];
};

/**
 * Khoảng [today, tomorrow) theo lịch DASHBOARD_TZ → Date UTC cho MongoDB.
 * @returns {{ today: Date, tomorrow: Date }}
 */
const getTodayDateRange = () => {
  const todayStart = startOfDayReportTz();
  const tomorrowStart = todayStart.add(1, 'day');
  return {
    today: todayStart.toDate(),
    tomorrow: tomorrowStart.toDate(),
  };
};

/**
 * Khoảng một ngày lịch (daysAgo = 0 là hôm nay theo DASHBOARD_TZ).
 * @param {number} daysAgo
 * @returns {{ date: Date, nextDate: Date }}
 */
const getDateRangeForDay = (daysAgo) => {
  const dateStart = startOfDayReportTz().subtract(daysAgo, 'day');
  const nextDateStart = dateStart.add(1, 'day');
  return {
    date: dateStart.toDate(),
    nextDate: nextDateStart.toDate(),
  };
};

/**
 * Calculate revenue for bookings created in a date range
 * @param {Array} hotelIds - Array of hotel ObjectIds
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Number>} Total revenue
 */
const calculateRevenueInRange = async (hotelIds, startDate, endDate) => {
  const result = await Booking.aggregate([
    {
      $match: {
        hotel: { $in: hotelIds },
        paymentStatus: 'paid',
        createdAt: { $gte: startDate, $lt: endDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' }
      }
    }
  ]);
  return result[0]?.total || 0;
};

/**
 * Calculate revenue for bookings that overlap with a date range
 * (for occupancy/revenue stats)
 * @param {Array} hotelIds - Array of hotel ObjectIds
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date
 * @returns {Promise<Number>} Total revenue
 */
const calculateRevenueForOccupiedRooms = async (hotelIds, startDate, endDate) => {
  const result = await Booking.aggregate([
    {
      $match: {
        hotel: { $in: hotelIds },
        paymentStatus: 'paid',
        checkInDate: { $lt: endDate },
        checkOutDate: { $gt: startDate }
      }
    },
    {
      $group: {
        _id: null,
        total: { $sum: '$totalAmount' }
      }
    }
  ]);
  return result[0]?.total || 0;
};

module.exports = {
  DAYS_OF_WEEK,
  DASHBOARD_TZ,
  getOwnerHotelIds,
  getScopedHotelIdsForOwner,
  getTodayDateRange,
  getDateRangeForDay,
  calculateRevenueInRange,
  calculateRevenueForOccupiedRooms,
};
