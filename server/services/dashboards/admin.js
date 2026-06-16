const User = require('../../models/User');
const Hotel = require('../../models/Hotel');
const Room = require('../../models/Room');
const Booking = require('../../models/Booking');
const ContactMessage = require('../../models/ContactMessage');
const { bookingRevenueSumExpr } = require('../bookings/bookingAmount');
const { startOfDayReportTz } = require('../reports/reportTz');
const { ServiceError } = require('../../lib/http/serviceError');

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

const PERIOD_LABELS = {
  week: '7 ngày qua',
  month: 'Tháng này',
  year: 'Năm nay',
};

const normalizePeriod = (period) => {
  const value = String(period || 'week').toLowerCase();
  if (!['week', 'month', 'year'].includes(value)) {
    throw new ServiceError(400, 'period phải là week, month hoặc year');
  }
  return value;
};

/**
 * Khoảng thời gian [start, endExclusive) theo Asia/Ho_Chi_Minh.
 */
const getPeriodDateRange = (period) => {
  const normalized = normalizePeriod(period);
  const today = startOfDayReportTz();
  const endExclusive = today.add(1, 'day');

  if (normalized === 'week') {
    return {
      period: normalized,
      periodLabel: PERIOD_LABELS.week,
      start: today.subtract(6, 'day').toDate(),
      endExclusive: endExclusive.toDate(),
    };
  }

  if (normalized === 'month') {
    return {
      period: normalized,
      periodLabel: PERIOD_LABELS.month,
      start: today.startOf('month').toDate(),
      endExclusive: endExclusive.toDate(),
    };
  }

  return {
    period: normalized,
    periodLabel: PERIOD_LABELS.year,
    start: today.startOf('year').toDate(),
    endExclusive: endExclusive.toDate(),
  };
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
      { $group: { _id: null, total: { $sum: bookingRevenueSumExpr } } }
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
  return activities.slice(0, 20);
};

/**
 * Doanh thu theo khách sạn trong kỳ (đơn đã thanh toán, theo ngày tạo đơn).
 * @returns {Promise<{ period, periodLabel, hotels: Array<{ hotelId, hotelName, revenue, bookingCount }> }>}
 */
const getRevenueByHotel = async (period = 'week') => {
  const { period: normalized, periodLabel, start, endExclusive } = getPeriodDateRange(period);

  const rows = await Booking.aggregate([
    {
      $match: {
        paymentStatus: 'paid',
        createdAt: { $gte: start, $lt: endExclusive },
        hotel: { $ne: null },
      },
    },
    {
      $group: {
        _id: '$hotel',
        revenue: { $sum: bookingRevenueSumExpr },
        bookingCount: { $sum: 1 },
      },
    },
    {
      $lookup: {
        from: 'hotels',
        localField: '_id',
        foreignField: '_id',
        as: 'hotelDoc',
      },
    },
    { $unwind: { path: '$hotelDoc', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        hotelId: '$_id',
        hotelName: { $ifNull: ['$hotelDoc.name', 'Khách sạn không xác định'] },
        revenue: 1,
        bookingCount: 1,
      },
    },
    { $sort: { revenue: -1, hotelName: 1 } },
  ]);

  return {
    period: normalized,
    periodLabel,
    hotels: rows.map((row) => ({
      hotelId: String(row.hotelId),
      hotelName: row.hotelName,
      revenue: row.revenue || 0,
      bookingCount: row.bookingCount || 0,
    })),
  };
};

/**
 * Liên hệ cần xử lý: chưa đọc hoặc chưa phản hồi.
 */
const getPendingContacts = async (limit = 20) => {
  const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 50);

  const messages = await ContactMessage.find({
    $or: [{ isRead: false }, { repliedAt: null }],
  })
    .sort({ createdAt: -1 })
    .limit(parsedLimit)
    .select('name email subject message isRead repliedAt createdAt')
    .lean();

  return messages.map((msg) => ({
    id: String(msg._id),
    name: msg.name,
    email: msg.email,
    subject: msg.subject,
    preview: String(msg.message || '').slice(0, 120),
    isRead: Boolean(msg.isRead),
    replied: Boolean(msg.repliedAt),
    createdAt: msg.createdAt,
  }));
};

module.exports = {
  getDashboardStats,
  getRecentActivities,
  getRevenueByHotel,
  getPendingContacts,
};
