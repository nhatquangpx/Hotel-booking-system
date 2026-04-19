const Booking = require('../../models/Booking');
const { REPORT_TZ } = require('./reportTz');

/**
 * Tổng đêm phòng trong kỳ + map YYYY-MM-DD → số đêm (REPORT_TZ), dùng MongoDB aggregation.
 * Tránh O(bookings × nights) trong JS khi admin chọn nhiều khách sạn / nhiều booking.
 * Yêu cầu MongoDB ≥ 5.0 ($dateTrunc, $dateDiff, $range theo pipeline hiện tại).
 *
 * @returns {{ totalRoomNights: number, nightMap: Map<string, number> }}
 */
async function aggregateRoomNightStats(hotelIds, rangeStart, rangeEndExclusive) {
  if (!hotelIds.length) {
    return { totalRoomNights: 0, nightMap: new Map() };
  }

  const pipeline = [
    {
      $match: {
        hotel: { $in: hotelIds },
        paymentStatus: 'paid',
        checkInDate: { $lt: rangeEndExclusive },
        checkOutDate: { $gt: rangeStart }
      }
    },
    {
      $addFields: {
        rs: { $literal: rangeStart },
        re: { $literal: rangeEndExclusive }
      }
    },
    {
      $addFields: {
        ci: { $dateTrunc: { date: '$checkInDate', unit: 'day', timezone: REPORT_TZ } },
        co: { $dateTrunc: { date: '$checkOutDate', unit: 'day', timezone: REPORT_TZ } }
      }
    },
    {
      $addFields: {
        segStart: { $cond: [{ $gt: ['$ci', '$rs'] }, '$ci', '$rs'] },
        segEnd: { $cond: [{ $lt: ['$co', '$re'] }, '$co', '$re'] }
      }
    },
    {
      $match: {
        $expr: { $lt: ['$segStart', '$segEnd'] }
      }
    },
    {
      $addFields: {
        nightCount: {
          $dateDiff: {
            startDate: '$segStart',
            endDate: '$segEnd',
            unit: 'day'
          }
        }
      }
    },
    {
      $match: { nightCount: { $gt: 0 } }
    },
    {
      $facet: {
        totalAgg: [
          {
            $group: {
              _id: null,
              totalRoomNights: { $sum: '$nightCount' }
            }
          }
        ],
        byDayPipeline: [
          {
            $addFields: {
              offsets: { $range: [0, '$nightCount'] }
            }
          },
          { $unwind: '$offsets' },
          {
            $addFields: {
              nightDate: {
                $dateAdd: {
                  startDate: '$segStart',
                  unit: 'day',
                  amount: '$offsets',
                  timezone: REPORT_TZ
                }
              }
            }
          },
          {
            $group: {
              _id: {
                $dateToString: {
                  format: '%Y-%m-%d',
                  date: '$nightDate',
                  timezone: REPORT_TZ
                }
              },
              roomNights: { $sum: 1 }
            }
          }
        ]
      }
    }
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
  aggregateRoomNightStats
};
