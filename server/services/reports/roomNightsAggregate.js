const Booking = require('../../models/Booking');
const { REPORT_TZ } = require('./reportTz');

/**
 * Tổng đêm phòng trong kỳ + map YYYY-MM-DD → số đêm (REPORT_TZ), dùng MongoDB aggregation.
 * @param {Array} hotelIds
 * @param {Date} rangeStart
 * @param {Date} rangeEndExclusive
 * @param {{ roomIds?: Array }} [options] — nếu có roomIds thì chỉ đếm đơn của các phòng đó
 * @returns {{ totalRoomNights: number, nightMap: Map<string, number> }}
 */
async function aggregateRoomNightStats(hotelIds, rangeStart, rangeEndExclusive, options = {}) {
  if (!hotelIds.length) {
    return { totalRoomNights: 0, nightMap: new Map() };
  }

  const { roomIds } = options;
  if (Array.isArray(roomIds) && roomIds.length === 0) {
    return { totalRoomNights: 0, nightMap: new Map() };
  }

  const match = {
    hotel: { $in: hotelIds },
    paymentStatus: 'paid',
    checkInDate: { $lt: rangeEndExclusive },
    checkOutDate: { $gt: rangeStart },
  };
  if (Array.isArray(roomIds) && roomIds.length > 0) {
    match.room = { $in: roomIds };
  }

  const pipeline = [
    { $match: match },
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
              totalRoomNights: { $sum: '$nightCount' },
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
              roomNights: { $sum: 1 },
            },
          },
        ],
      },
    },
  ];

  const rows = await Booking.aggregate(pipeline).allowDiskUse(true);
  const row = rows[0] || { totalAgg: [], byDayPipeline: [] };

  const totalRoomNights = row.totalAgg[0]?.totalRoomNights ?? 0;
  const nightMap = new Map();
  for (const d of row.byDayPipeline) {
    if (d._id) {
      nightMap.set(d._id, d.roomNights);
    }
  }

  return { totalRoomNights, nightMap };
}

module.exports = {
  aggregateRoomNightStats,
};
