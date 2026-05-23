const User = require('../../models/User');
const Hotel = require('../../models/Hotel');
const Room = require('../../models/Room');
const Booking = require('../../models/Booking');

const PAYMENT_STATUS_LABELS = {
  pending: 'chờ thanh toán',
  paid: 'đã thanh toán',
  cancelled: 'đã hủy',
};

const ROLE_LABELS = {
  guest: 'Khách',
  admin: 'Quản trị viên',
  owner: 'Chủ khách sạn',
  staff: 'Nhân viên',
};

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
 * Hoạt động gần đây: gộp bản ghi mới nhất (tạo user / KS / phòng / đặt phòng), sắp xếp theo thời gian.
 * @returns {Promise<Array<{ time, user, action, type, entityId? }>>}
 */
const getRecentActivities = async () => {
  const [users, hotels, rooms, bookings] = await Promise.all([
    User.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('name role createdAt')
      .lean(),
    Hotel.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('ownerId', 'name')
      .select('name ownerId createdAt')
      .lean(),
    Room.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate({
        path: 'hotelId',
        select: 'name',
        populate: { path: 'ownerId', select: 'name' },
      })
      .select('roomNumber hotelId createdAt')
      .lean(),
    Booking.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('guest', 'name')
      .populate('hotel', 'name')
      .populate('room', 'roomNumber')
      .select('guest hotel room paymentStatus createdAt')
      .lean(),
  ]);

  const activities = [
    ...users.map((u) => ({
      time: u.createdAt,
      user: u.name,
      action: `Đăng ký tài khoản (${ROLE_LABELS[u.role] || u.role})`,
      type: 'user',
      entityId: String(u._id),
    })),
    ...hotels.map((h) => ({
      time: h.createdAt,
      user: h.ownerId?.name || 'Chủ khách sạn',
      action: `Tạo khách sạn: ${h.name}`,
      type: 'hotel',
      entityId: String(h._id),
    })),
    ...rooms.map((r) => {
      const hotelName = r.hotelId?.name || 'khách sạn';
      return {
        time: r.createdAt,
        user: r.hotelId?.ownerId?.name || 'Chủ khách sạn',
        action: `Thêm phòng ${r.roomNumber} (${hotelName})`,
        type: 'room',
        entityId: String(r._id),
      };
    }),
    ...bookings.map((b) => {
      const roomLabel = b.room?.roomNumber ? `phòng ${b.room.roomNumber}` : 'phòng';
      const hotelLabel = b.hotel?.name || 'khách sạn';
      const payLabel = PAYMENT_STATUS_LABELS[b.paymentStatus] || b.paymentStatus;
      return {
        time: b.createdAt,
        user: b.guest?.name || 'Khách',
        action: `Đặt ${roomLabel} tại ${hotelLabel} — ${payLabel}`,
        type: 'booking',
        entityId: String(b._id),
      };
    }),
  ];

  activities.sort((a, b) => new Date(b.time) - new Date(a.time));
  return activities.slice(0, 10);
};

module.exports = {
  getDashboardStats,
  getRecentActivities
};
