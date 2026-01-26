const Hotel = require('../../models/Hotel');
const Room = require('../../models/Room');
const Booking = require('../../models/Booking');
const {
  DAYS_OF_WEEK,
  getOwnerHotelIds,
  getTodayDateRange,
  getDateRangeForDay,
  calculateRevenueInRange,
  calculateRevenueForOccupiedRooms
} = require('./core');

/**
 * Owner Dashboard Service
 * All dashboard operations specific to owner role
 */

/**
 * Get dashboard statistics for owner
 * @param {String} ownerId - Owner user ID
 * @returns {Promise<Object>} Dashboard stats
 */
const getDashboardStats = async (ownerId) => {
  const hotelIds = await getOwnerHotelIds(ownerId);
  
  if (hotelIds.length === 0) {
    return {
      todayRevenue: 0,
      availableRooms: 0,
      totalRooms: 0,
      roomsToClean: 0,
      brokenRooms: 0
    };
  }

  const { today, tomorrow } = getTodayDateRange();

  // Calculate today's revenue
  const todayRevenue = await calculateRevenueInRange(hotelIds, today, tomorrow);

  // Get room statistics
  const rooms = await Room.find({ hotelId: { $in: hotelIds } });
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => 
    r.bookingStatus === 'empty' && r.roomStatus === 'active'
  ).length;
  const brokenRooms = rooms.filter(r => r.roomStatus === 'maintenance').length;

  // Get rooms to clean (checked out today but not cleaned yet)
  const todayCheckouts = await Booking.find({
    hotel: { $in: hotelIds },
    checkedOutAt: { $gte: today, $lt: tomorrow }
  }).select('room').lean();
  
  const checkoutRoomIds = todayCheckouts.map(b => b.room);
  const roomsToClean = await Room.countDocuments({
    _id: { $in: checkoutRoomIds },
    bookingStatus: { $in: ['occupied', 'pending'] }
  });

  return {
    todayRevenue,
    availableRooms,
    totalRooms,
    roomsToClean,
    brokenRooms
  };
};

/**
 * Get weekly revenue statistics (last 7 days)
 * @param {String} ownerId - Owner user ID
 * @returns {Promise<Array>} Array of { day, value } objects
 */
const getWeeklyRevenue = async (ownerId) => {
  const hotelIds = await getOwnerHotelIds(ownerId);
  
  if (hotelIds.length === 0) {
    return [];
  }

  const revenueData = [];
  
  for (let i = 6; i >= 0; i--) {
    const { date, nextDate } = getDateRangeForDay(i);
    const dayRevenue = await calculateRevenueInRange(hotelIds, date, nextDate);
    const dayIndex = date.getDay();
    
    revenueData.push({
      day: DAYS_OF_WEEK[dayIndex],
      value: dayRevenue
    });
  }

  return revenueData;
};

/**
 * Get room occupancy statistics (last 7 days)
 * @param {String} ownerId - Owner user ID
 * @returns {Promise<Array>} Array of { day, value } objects
 */
const getRoomOccupancy = async (ownerId) => {
  const hotelIds = await getOwnerHotelIds(ownerId);
  
  if (hotelIds.length === 0) {
    return [];
  }

  const occupancyData = [];
  
  for (let i = 6; i >= 0; i--) {
    const { date, nextDate } = getDateRangeForDay(i);
    const dayRevenue = await calculateRevenueForOccupiedRooms(hotelIds, date, nextDate);
    const dayIndex = date.getDay();
    
    occupancyData.push({
      day: DAYS_OF_WEEK[dayIndex],
      value: dayRevenue
    });
  }

  return occupancyData;
};

/**
 * Get today's tasks for owner
 * @param {String} ownerId - Owner user ID
 * @returns {Promise<Array>} Array of task objects
 */
const getTodayTasks = async (ownerId) => {
  const ownerHotels = await Hotel.find({ ownerId }).select('_id policies');
  const hotelIds = ownerHotels.map(hotel => hotel._id);
  const hotelPoliciesMap = {};
  ownerHotels.forEach(hotel => {
    hotelPoliciesMap[hotel._id.toString()] = hotel.policies;
  });
  
  if (hotelIds.length === 0) {
    return [];
  }

  const { today, tomorrow } = getTodayDateRange();
  const tasks = [];

  // Check-in tasks (today)
  const todayCheckIns = await Booking.find({
    hotel: { $in: hotelIds },
    paymentStatus: 'paid',
    checkInDate: { $gte: today, $lt: tomorrow },
    checkedInAt: null
  })
    .populate('room', 'roomNumber')
    .populate('guest', 'name')
    .lean();

  todayCheckIns.forEach(booking => {
    const policies = hotelPoliciesMap[booking.hotel?.toString()] || {};
    const checkInTime = policies.checkInTime || '14:00';
    tasks.push({
      id: `checkin-${booking._id}`,
      type: 'checkin',
      text: `Khách đến - Phòng ${booking.room?.roomNumber || 'N/A'}`,
      time: checkInTime,
      urgent: false
    });
  });

  // Check-out tasks (today)
  const todayCheckOuts = await Booking.find({
    hotel: { $in: hotelIds },
    paymentStatus: 'paid',
    checkOutDate: { $gte: today, $lt: tomorrow },
    checkedOutAt: null
  })
    .populate('room', 'roomNumber')
    .populate('guest', 'name')
    .lean();

  todayCheckOuts.forEach(booking => {
    const policies = hotelPoliciesMap[booking.hotel?.toString()] || {};
    const checkOutTime = policies.checkOutTime || '12:00';
    tasks.push({
      id: `checkout-${booking._id}`,
      type: 'checkout',
      text: `Check-out phòng ${booking.room?.roomNumber || 'N/A'}`,
      time: checkOutTime,
      urgent: false
    });
  });

  // Cleaning tasks (checked out today but not cleaned)
  const checkedOutBookings = await Booking.find({
    hotel: { $in: hotelIds },
    checkedOutAt: { $gte: today, $lt: tomorrow }
  })
    .populate('room', 'roomNumber bookingStatus')
    .lean();

  const roomsToClean = checkedOutBookings
    .filter(b => b.room && (b.room.bookingStatus === 'occupied' || b.room.bookingStatus === 'pending'))
    .map(b => b.room.roomNumber);

  if (roomsToClean.length > 0) {
    tasks.push({
      id: 'cleaning',
      type: 'cleaning',
      text: `Dọn phòng ${roomsToClean.join(', ')}`,
      urgent: true
    });
  }

  // Maintenance tasks
  const brokenRooms = await Room.find({
    hotelId: { $in: hotelIds },
    roomStatus: 'maintenance'
  }).select('roomNumber').lean();

  brokenRooms.forEach(room => {
    tasks.push({
      id: `maintenance-${room._id}`,
      type: 'maintenance',
      text: `Sửa chữa phòng ${room.roomNumber}`,
      urgent: true
    });
  });

  return tasks;
};

module.exports = {
  getDashboardStats,
  getWeeklyRevenue,
  getRoomOccupancy,
  getTodayTasks
};
