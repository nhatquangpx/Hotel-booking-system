const User = require('../../models/User');
const Hotel = require('../../models/Hotel');
const Room = require('../../models/Room');
const Booking = require('../../models/Booking');

/**
 * Admin Dashboard Service
 * All dashboard operations specific to admin role
 */

/**
 * Get dashboard statistics for admin
 * @returns {Promise<Object>} Dashboard stats
 */
const getDashboardStats = async () => {
  const [totalUsers, totalRooms, totalHotels, totalBookings, revenueResult] = await Promise.all([
    User.countDocuments(),
    Room.countDocuments(),
    Hotel.countDocuments(),
    Booking.countDocuments(),
    Booking.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ])
  ]);
  
  const revenue = revenueResult[0]?.total || 0;
  
  return {
    totalUsers,
    totalRooms,
    totalHotels,
    totalBookings,
    revenue
  };
};

/**
 * Get recent activities for admin
 * @returns {Promise<Array>} Array of activity objects
 */
const getRecentActivities = async () => {
  const [users, hotels, rooms, bookings] = await Promise.all([
    User.find().sort({ createdAt: -1 }).limit(5).lean(),
    Hotel.find().sort({ createdAt: -1 }).limit(5).lean(),
    Room.find().sort({ createdAt: -1 }).limit(5).lean(),
    Booking.find().sort({ createdAt: -1 }).limit(5).lean()
  ]);

  const activities = [
    ...users.map(u => ({
      time: u.createdAt,
      user: u.name,
      action: 'Tạo tài khoản người dùng',
      type: 'user'
    })),
    ...hotels.map(h => ({
      time: h.createdAt,
      user: h.ownerName || 'Chủ khách sạn',
      action: `Tạo khách sạn: ${h.name}`,
      type: 'hotel'
    })),
    ...rooms.map(r => ({
      time: r.createdAt,
      user: r.createdByName || 'Chủ khách sạn',
      action: `Tạo phòng: ${r.roomNumber}`,
      type: 'room'
    })),
    ...bookings.map(b => ({
      time: b.createdAt,
      user: b.guestName || 'Khách',
      action: `Đặt phòng: ${b._id}`,
      type: 'booking'
    }))
  ];

  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  return activities.slice(0, 10);
};

module.exports = {
  getDashboardStats,
  getRecentActivities
};
