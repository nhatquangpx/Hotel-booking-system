const Booking = require('../../models/Booking');
const { REPORT_TZ } = require('./reportTz');
const { bookingRevenueSumExpr } = require('../bookings/bookingAmount');

/**
 * Doanh thu theo hiệu suất phòng: chia finalAmount đều cho mỗi đêm lưu trú,
 * chỉ cộng các đêm nằm trong [rangeStart, rangeEndExclusive).
 *
 * Ví dụ: đơn 4 đêm, finalAmount = 4.000.000 → mỗi đêm +1.000.000 vào ngày tương ứng.
 *
 * @returns {{
 *   totalRevenue: number,
 *   bookingCount: number,
 *   revenueMap: Map<string, number>,
 *   bookingsMap: Map<string, number>
 * }}
 */
async function aggregateStayRevenueStats(hotelIds, rangeStart, rangeEndExclusive) {
  if (!hotelIds.length) {
    return {
      totalRevenue: 0,
      bookingCount: 0,
      revenueMap: new Map(),
      bookingsMap: new Map(),
    };
  }

  const pipeline = [
    {
      $match: {
        hotel: { $in: hotelIds },
        paymentStatus: 'paid',
        checkInDate: { $lt: rangeEndExclusive },
        checkOutDate: { $gt: rangeStart },
      },
    },
    {
      $addFields: {
        rs: { $literal: rangeStart },
        re: { $literal: rangeEndExclusive },
      },
    },
    {
      $addFields: {
        ci: { $dateTrunc: { date: '$checkInDate', unit: 'day', timezone: REPORT_TZ } },
        co: { $dateTrunc: { date: '$checkOutDate', unit: 'day', timezone: REPORT_TZ } },
      },
    },
    {
      $addFields: {
        totalNights: {
          $dateDiff: {
            startDate: '$ci',
            endDate: '$co',
            unit: 'day',
          },
        },
      },
    },
    {
      $match: { totalNights: { $gt: 0 } },
    },
    {
      $addFields: {
        revenuePerNight: {
          $divide: [{ $ifNull: [bookingRevenueSumExpr, 0] }, '$totalNights'],
        },
        segStart: { $cond: [{ $gt: ['$ci', '$rs'] }, '$ci', '$rs'] },
        segEnd: { $cond: [{ $lt: ['$co', '$re'] }, '$co', '$re'] },
      },
    },
    {
      $match: {
        $expr: { $lt: ['$segStart', '$segEnd'] },
      },
    },
    {
      $addFields: {
        nightCount: {
          $dateDiff: {
            startDate: '$segStart',
            endDate: '$segEnd',
            unit: 'day',
          },
        },
      },
    },
    {
      $match: { nightCount: { $gt: 0 } },
    },
    {
      $facet: {
        totalAgg: [
          {
            $group: {
              _id: null,
              totalRevenue: {
                $sum: { $multiply: ['$revenuePerNight', '$nightCount'] },
              },
              bookingCount: { $sum: 1 },
            },
          },
        ],
        byDayPipeline: [
          {
            $addFields: {
              offsets: { $range: [0, '$nightCount'] },
            },
          },
          { $unwind: '$offsets' },
          {
            $addFields: {
              nightDate: {
                $dateAdd: {
                  startDate: '$segStart',
                  unit: 'day',
                  amount: '$offsets',
                  timezone: REPORT_TZ,
                },
              },
            },
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$nightDate',
                  timezone: REPORT_TZ,
                },
              },
              revenue: { $sum: '$revenuePerNight' },
              bookings: { $sum: 1 },
            },
          },
        ],
      },
    },
  ];

  const rows = await Booking.aggregate(pipeline).allowDiskUse(true);
  const row = rows[0] || { totalAgg: [], byDayPipeline: [] };
  const totals = row.totalAgg[0] || {};

  const revenueMap = new Map();
  const bookingsMap = new Map();
  for (const d of row.byDayPipeline) {
    if (!d._id) continue;
    revenueMap.set(d._id, d.revenue || 0);
    bookingsMap.set(d._id, d.bookings || 0);
  }

  return {
    totalRevenue: totals.totalRevenue || 0,
    bookingCount: totals.bookingCount || 0,
    revenueMap,
    bookingsMap,
  };
}

/**
 * Tổng doanh thu phân bổ theo đêm trong khoảng (dùng cho dashboard).
 */
async function sumStayRevenueInRange(hotelIds, rangeStart, rangeEndExclusive) {
  const { totalRevenue } = await aggregateStayRevenueStats(
    hotelIds,
    rangeStart,
    rangeEndExclusive
  );
  return totalRevenue;
}

/**
 * Doanh thu theo khách sạn trong kỳ (phân bổ theo đêm lưu trú).
 * @returns {Promise<Array<{ hotelId, revenue, bookingCount }>>}
 */
async function aggregateStayRevenueByHotel(rangeStart, rangeEndExclusive) {
  const pipeline = [
    {
      $match: {
        paymentStatus: 'paid',
        hotel: { $ne: null },
        checkInDate: { $lt: rangeEndExclusive },
        checkOutDate: { $gt: rangeStart },
      },
    },
    {
      $addFields: {
        rs: { $literal: rangeStart },
        re: { $literal: rangeEndExclusive },
      },
    },
    {
      $addFields: {
        ci: { $dateTrunc: { date: '$checkInDate', unit: 'day', timezone: REPORT_TZ } },
        co: { $dateTrunc: { date: '$checkOutDate', unit: 'day', timezone: REPORT_TZ } },
      },
    },
    {
      $addFields: {
        totalNights: {
          $dateDiff: {
            startDate: '$ci',
            endDate: '$co',
            unit: 'day',
          },
        },
      },
    },
    { $match: { totalNights: { $gt: 0 } } },
    {
      $addFields: {
        revenuePerNight: {
          $divide: [{ $ifNull: [bookingRevenueSumExpr, 0] }, '$totalNights'],
        },
        segStart: { $cond: [{ $gt: ['$ci', '$rs'] }, '$ci', '$rs'] },
        segEnd: { $cond: [{ $lt: ['$co', '$re'] }, '$co', '$re'] },
      },
    },
    {
      $match: {
        $expr: { $lt: ['$segStart', '$segEnd'] },
      },
    },
    {
      $addFields: {
        nightCount: {
          $dateDiff: {
            startDate: '$segStart',
            endDate: '$segEnd',
            unit: 'day',
          },
        },
      },
    },
    { $match: { nightCount: { $gt: 0 } } },
    {
      $group: {
        _id: '$hotel',
        revenue: {
          $sum: { $multiply: ['$revenuePerNight', '$nightCount'] },
        },
        bookingCount: { $sum: 1 },
      },
    },
  ];

  return Booking.aggregate(pipeline).allowDiskUse(true);
}

/**
 * Doanh thu / đêm phòng / số đơn theo loại phòng trong kỳ (phân bổ theo đêm lưu trú).
 * @returns {Promise<Array<{ roomType, revenue, roomNights, bookingCount }>>}
 */
async function aggregateStayRevenueByRoomType(hotelIds, rangeStart, rangeEndExclusive) {
  if (!hotelIds.length) return [];

  const pipeline = [
    {
      $match: {
        hotel: { $in: hotelIds },
        paymentStatus: 'paid',
        checkInDate: { $lt: rangeEndExclusive },
        checkOutDate: { $gt: rangeStart },
      },
    },
    {
      $addFields: {
        rs: { $literal: rangeStart },
        re: { $literal: rangeEndExclusive },
      },
    },
    {
      $addFields: {
        ci: { $dateTrunc: { date: '$checkInDate', unit: 'day', timezone: REPORT_TZ } },
        co: { $dateTrunc: { date: '$checkOutDate', unit: 'day', timezone: REPORT_TZ } },
      },
    },
    {
      $addFields: {
        totalNights: {
          $dateDiff: {
            startDate: '$ci',
            endDate: '$co',
            unit: 'day',
          },
        },
      },
    },
    { $match: { totalNights: { $gt: 0 } } },
    {
      $addFields: {
        revenuePerNight: {
          $divide: [{ $ifNull: [bookingRevenueSumExpr, 0] }, '$totalNights'],
        },
        segStart: { $cond: [{ $gt: ['$ci', '$rs'] }, '$ci', '$rs'] },
        segEnd: { $cond: [{ $lt: ['$co', '$re'] }, '$co', '$re'] },
      },
    },
    {
      $match: {
        $expr: { $lt: ['$segStart', '$segEnd'] },
      },
    },
    {
      $addFields: {
        nightCount: {
          $dateDiff: {
            startDate: '$segStart',
            endDate: '$segEnd',
            unit: 'day',
          },
        },
      },
    },
    { $match: { nightCount: { $gt: 0 } } },
    {
      $lookup: {
        from: 'rooms',
        localField: 'room',
        foreignField: '_id',
        as: 'roomDoc',
      },
    },
    { $unwind: { path: '$roomDoc', preserveNullAndEmptyArrays: true } },
    {
      $group: {
        _id: { $ifNull: ['$roomDoc.type', 'unknown'] },
        revenue: {
          $sum: { $multiply: ['$revenuePerNight', '$nightCount'] },
        },
        roomNights: { $sum: '$nightCount' },
        bookingCount: { $sum: 1 },
      },
    },
  ];

  const rows = await Booking.aggregate(pipeline).allowDiskUse(true);
  return rows.map((r) => ({
    roomType: r._id,
    revenue: r.revenue || 0,
    roomNights: r.roomNights || 0,
    bookingCount: r.bookingCount || 0,
  }));
}

/**
 * Số đơn tạo mới theo ngày (YYYY-MM-DD, REPORT_TZ) — xu hướng đặt phòng.
 */
async function aggregateBookingsCreatedByDay(hotelIds, rangeStart, rangeEndExclusive) {
  const map = new Map();
  if (!hotelIds.length) return map;

  const rows = await Booking.aggregate([
    {
      $match: {
        hotel: { $in: hotelIds },
        createdAt: { $gte: rangeStart, $lt: rangeEndExclusive },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: '$createdAt',
            timezone: REPORT_TZ,
          },
        },
        count: { $sum: 1 },
        paidCount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, 1, 0] },
        },
        cancelledCount: {
          $sum: { $cond: [{ $eq: ['$paymentStatus', 'cancelled'] }, 1, 0] },
        },
      },
    },
  ]);

  for (const r of rows) {
    if (!r._id) continue;
    map.set(r._id, {
      count: r.count || 0,
      paidCount: r.paidCount || 0,
      cancelledCount: r.cancelledCount || 0,
    });
  }
  return map;
}

module.exports = {
  aggregateStayRevenueStats,
  sumStayRevenueInRange,
  aggregateStayRevenueByHotel,
  aggregateStayRevenueByRoomType,
  aggregateBookingsCreatedByDay,
};
