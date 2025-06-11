const User = require('../models/User');
const Hotel = require('../models/Hotel');
const Room = require('../models/Room');
const Booking = require('../models/Booking');

exports.getAdminStats = async (req, res) => {
  try {
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
    res.json({ totalUsers, totalRooms, totalHotels, totalBookings, revenue });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi lấy thống kê', error: error.message });
  }
};

exports.getRecentActivities = async (req, res) => {
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
  res.json(activities.slice(0, 10));
};
