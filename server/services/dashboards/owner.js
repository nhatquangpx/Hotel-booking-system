const Hotel = require('../../models/Hotel');
const Room = require('../../models/Room');
const Booking = require('../../models/Booking');
const Review = require('../../models/Review');
const SalePromotion = require('../../models/SalePromotion');
const { vnDateKey, activeSaleOnDateFilter } = require('../sale/saleShared');
const {
  DAYS_OF_WEEK,
  getScopedHotelIdsForOwner,
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
const getDashboardStats = async (ownerId, hotelId) => {
  const hotelIds = await getScopedHotelIdsForOwner(ownerId, hotelId);

  if (hotelIds.length === 0) {
    return {
      todayRevenue: 0,
      availableRooms: 0,
      totalRooms: 0,
      equipmentAttentionCount: 0,
      activeSalesCount: 0,
      reviewsAwaitingReply: 0,
      bookingsAwaitingAction: 0,
    };
  }

  const { today, tomorrow } = getTodayDateRange();
  /** Cùng chuẩn YYYY-MM-DD (Asia/Ho_Chi_Minh) với SalePromotion & salePricingService */
  const ymdToday = vnDateKey(new Date());

  // Calculate today's revenue
  const todayRevenue = await calculateRevenueInRange(hotelIds, today, tomorrow);

  // Get room statistics
  const rooms = await Room.find({ hotelId: { $in: hotelIds } });
  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(
    (r) => r.bookingStatus === 'empty' && r.roomStatus === 'active'
  ).length;

  /** Thiết bị Hỏng / Đang sửa chữa (roomEquipment) */
  const equipmentAgg = await Room.aggregate([
    { $match: { hotelId: { $in: hotelIds } } },
    { $unwind: '$roomEquipment' },
    { $match: { 'roomEquipment.status': { $in: ['broken', 'under_repair'] } } },
    { $count: 'n' },
  ]);
  const equipmentAttentionCount = equipmentAgg[0]?.n || 0;

  /** Chương trình sale đang chạy (read-only filter, không ghi DB) */
  const activeSalesCount = await SalePromotion.countDocuments({
    hotelId: { $in: hotelIds },
    ...activeSaleOnDateFilter(ymdToday),
  });

  /** Đánh giá chưa có phản hồi từ chủ khách sạn */
  const reviewsAwaitingReply = await Review.countDocuments({
    hotel: { $in: hotelIds },
    $or: [{ ownerResponse: { $exists: false } }, { ownerResponse: null }, { ownerResponse: '' }],
  });

  const pendingPaymentCount = await Booking.countDocuments({
    hotel: { $in: hotelIds },
    paymentStatus: 'pending',
  });

  const refundPendingCount = await Booking.countDocuments({
    hotel: { $in: hotelIds },
    paymentStatus: 'cancelled',
    guestCancelRequestedAt: { $ne: null },
    ownerRefundCompletedAt: null,
    'guestCancelSnapshot.wasPaid': true,
    'guestCancelSnapshot.refundPolicyEligible': true,
  });

  const checkInOutTodayCount = await Booking.countDocuments({
    hotel: { $in: hotelIds },
    paymentStatus: 'paid',
    $or: [
      {
        checkInDate: { $gte: today, $lt: tomorrow },
        $or: [{ checkedInAt: null }, { checkedInAt: { $exists: false } }],
      },
      {
        checkOutDate: { $gte: today, $lt: tomorrow },
        checkedInAt: { $ne: null },
        $or: [{ checkedOutAt: null }, { checkedOutAt: { $exists: false } }],
      },
    ],
  });

  return {
    todayRevenue,
    availableRooms,
    totalRooms,
    equipmentAttentionCount,
    activeSalesCount,
    reviewsAwaitingReply,
    bookingsAwaitingAction: pendingPaymentCount + refundPendingCount + checkInOutTodayCount,
  };
};

/**
 * Get weekly revenue statistics (last 7 days)
 * @param {String} ownerId - Owner user ID
 * @param {String|null} hotelId - optional: one hotel (must belong to owner)
 * @returns {Promise<Array>} Array of { day, value } objects
 */
const getWeeklyRevenue = async (ownerId, hotelId) => {
  const hotelIds = await getScopedHotelIdsForOwner(ownerId, hotelId || null);

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
const getRoomOccupancy = async (ownerId, hotelId) => {
  const hotelIds = await getScopedHotelIdsForOwner(ownerId, hotelId);

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
const getTodayTasks = async (ownerId, hotelId) => {
  const hotelIds = await getScopedHotelIdsForOwner(ownerId, hotelId);

  if (hotelIds.length === 0) {
    return [];
  }

  const ownerHotels = await Hotel.find({ _id: { $in: hotelIds } }).select('_id policies name');
  const hotelPoliciesMap = {};
  const hotelNameMap = {};
  ownerHotels.forEach((hotel) => {
    const id = hotel._id.toString();
    hotelPoliciesMap[id] = hotel.policies;
    hotelNameMap[id] = hotel.name || '';
  });
  const multiHotelScope = hotelIds.length > 1;

  const { today, tomorrow } = getTodayDateRange();
  const tasks = [];

  const pendingPayments = await Booking.find({
    hotel: { $in: hotelIds },
    paymentStatus: 'pending',
  })
    .populate('room', 'roomNumber')
    .populate('guest', 'name')
    .sort({ checkInDate: 1 })
    .lean();

  pendingPayments.forEach((booking) => {
    const guestName = booking.guest?.name || 'Khách';
    const roomNo = booking.room?.roomNumber || 'N/A';
    const hasProof =
      booking.paymentMethod === 'qr_code' &&
      booking.qrPaymentReportedAt &&
      booking.qrPaymentProofUrl;

    tasks.push({
      id: `pending-${booking._id}`,
      type: 'urgent',
      text: hasProof
        ? `Xác nhận TT (đã có MC) — ${guestName} · P.${roomNo}`
        : `Chờ xác nhận TT — ${guestName} · P.${roomNo}`,
      urgent: true,
      linkTo: `/owner/bookings?filter=action&bookingId=${booking._id}`,
    });
  });

  const refundPending = await Booking.find({
    hotel: { $in: hotelIds },
    paymentStatus: 'cancelled',
    guestCancelRequestedAt: { $ne: null },
    ownerRefundCompletedAt: null,
    'guestCancelSnapshot.wasPaid': true,
    'guestCancelSnapshot.refundPolicyEligible': true,
  })
    .populate('room', 'roomNumber')
    .populate('guest', 'name')
    .sort({ guestCancelRequestedAt: 1 })
    .lean();

  refundPending.forEach((booking) => {
    const guestName = booking.guest?.name || 'Khách';
    const roomNo = booking.room?.roomNumber || 'N/A';

    tasks.push({
      id: `refund-${booking._id}`,
      type: 'urgent',
      text: `Chờ hoàn tiền — ${guestName} · P.${roomNo}`,
      urgent: true,
      linkTo: `/owner/bookings?filter=action&bookingId=${booking._id}`,
    });
  });

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
      urgent: false,
      linkTo: `/owner/bookings?filter=action&bookingId=${booking._id}`,
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
      urgent: false,
      linkTo: `/owner/bookings?filter=action&bookingId=${booking._id}`,
    });
  });

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
      urgent: true,
      linkTo: '/owner/rooms',
    });
  });

  // Thiết bị phòng: Hỏng / Đang sửa chữa (roomEquipment)
  const roomsWithEquipmentIssues = await Room.find({
    hotelId: { $in: hotelIds },
    roomEquipment: { $elemMatch: { status: { $in: ['broken', 'under_repair'] } } },
  })
    .select('roomNumber hotelId +roomEquipment')
    .lean();

  for (const room of roomsWithEquipmentIssues) {
    const hotelKey = room.hotelId?.toString();
    const prefix =
      multiHotelScope && hotelKey && hotelNameMap[hotelKey]
        ? `${hotelNameMap[hotelKey]} — `
        : '';
    const roomNo = room.roomNumber != null ? String(room.roomNumber) : '';

    for (const eq of room.roomEquipment || []) {
      if (eq.status !== 'broken' && eq.status !== 'under_repair') continue;
      const eqId = eq._id != null ? String(eq._id) : '';
      if (!eqId) continue;
      const name = String(eq.name || 'Thiết bị').trim() || 'Thiết bị';

      if (eq.status === 'broken') {
        tasks.push({
          id: `equipment-broken-${room._id}-${eqId}`,
          type: 'equipment_broken',
          text: `${prefix}Thiết bị hỏng — Phòng ${roomNo}: ${name}`,
          urgent: true,
          linkTo: '/owner/equipment',
        });
      } else {
        tasks.push({
          id: `equipment-repair-${room._id}-${eqId}`,
          type: 'equipment_under_repair',
          text: `${prefix}Thiết bị đang sửa — Phòng ${roomNo}: ${name}`,
          urgent: false,
          linkTo: '/owner/equipment',
        });
      }
    }
  }

  return tasks;
};

module.exports = {
  getDashboardStats,
  getWeeklyRevenue,
  getRoomOccupancy,
  getTodayTasks
};
