const Hotel = require('../../models/Hotel');
const Room = require('../../models/Room');
const Booking = require('../../models/Booking');

/**
 * Dashboard Core Service
 * Shared helper functions for dashboard services
 */

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

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
 * Get date range for today (start and end of day)
 * @returns {Object} { today, tomorrow }
 */
const getTodayDateRange = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { today, tomorrow };
};

/**
 * Get date range for a specific day (i days ago)
 * @param {Number} daysAgo - Number of days ago (0 = today, 1 = yesterday, etc.)
 * @returns {Object} { date, nextDate }
 */
const getDateRangeForDay = (daysAgo) => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  date.setHours(0, 0, 0, 0);
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + 1);
  return { date, nextDate };
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
  getOwnerHotelIds,
  getScopedHotelIdsForOwner,
  getTodayDateRange,
  getDateRangeForDay,
  calculateRevenueInRange,
  calculateRevenueForOccupiedRooms
};
