const mongoose = require("mongoose");
const Hotel = require("../../models/Hotel");
const Room = require("../../models/Room");
const Booking = require("../../models/Booking");
const { getOwnerHotelIds } = require("../dashboards/core");

const WD_SHORT = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WD_LABEL_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

/** Thứ tự hiển thị / xử lý loại phòng (khớp enum Room.type) */
const ROOM_TYPE_ORDER = ["standard", "deluxe", "suite", "family", "executive"];

const ROOM_TYPE_LABEL_VI = {
  standard: "Tiêu chuẩn",
  deluxe: "Deluxe",
  suite: "Suite",
  family: "Gia đình",
  executive: "Executive",
};

/**
 * Chỉ số thứ trong tuần theo múi giờ Asia/Ho_Chi_Minh (0 = Chủ nhật)
 */
function vnWeekdayIndex(date) {
  const w = date.toLocaleDateString("en-US", {
    timeZone: "Asia/Ho_Chi_Minh",
    weekday: "short",
  });
  const i = WD_SHORT.indexOf(w);
  return i >= 0 ? i : 0;
}

function vnDateKey(date) {
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
}

function vnDayBoundsFromKey(dateKey) {
  const start = new Date(`${dateKey}T00:00:00+07:00`);
  const end = new Date(start.getTime() + 86400000);
  return { start, end };
}

const { readRoomPrice } = require("../rooms/roomPrice");

function effectiveNightly(room) {
  return readRoomPrice(room?.price);
}

function roundVnd(amount) {
  const step = 10000;
  return Math.round(amount / step) * step;
}

function occupancyMultiplier(rate) {
  if (rate >= 0.9) return 1.12;
  if (rate >= 0.75) return 1.08;
  if (rate >= 0.5) return 1.02;
  if (rate <= 0.15) return 0.88;
  if (rate <= 0.25) return 0.92;
  return 1;
}

function seasonMultiplierForDateKey(dateKey) {
  const [, m, d] = dateKey.split("-").map(Number);
  const month = m;
  const day = d;

  if (month === 12 && day >= 20) return 1.1;
  if (month === 1 && day <= 5) return 1.1;
  if (month === 4 && day >= 28 && day <= 30) return 1.06;
  if (month === 5 && day <= 2) return 1.06;
  if (month >= 6 && month <= 8) return 1.04;
  return 1;
}

/**
 * Đếm số đêm đã bán theo thứ (VN) trong lookback, tách theo loại phòng (từ booking.room.type)
 */
function accumulateWeekdayNightCountsByType(bookings, lookbackStart) {
  /** @type {Record<string, number[]>} */
  const byType = {};
  for (const b of bookings) {
    const rt = b.room?.type;
    if (!rt) continue;
    if (!byType[rt]) byType[rt] = [0, 0, 0, 0, 0, 0, 0];
    let night = new Date(b.checkInDate);
    const checkout = new Date(b.checkOutDate);
    while (night < checkout) {
      if (night >= lookbackStart) {
        byType[rt][vnWeekdayIndex(night)] += 1;
      }
      night = new Date(night.getTime() + 86400000);
    }
  }
  return byType;
}

function historicalWeekdayMultipliers(weekdayNightCounts) {
  const maxC = Math.max(...weekdayNightCounts, 0);
  if (maxC === 0) {
    return [1, 1, 1, 1, 1, 1, 1];
  }
  return weekdayNightCounts.map((c) => 0.88 + 0.22 * (c / maxC));
}

const LOOKBACK_DAYS = 84;

/** Làm mượt nhẹ tích các hệ số: kéo product về 1 để bộ quy tắc không quá cực đoan (tuỳ chọn tinh chỉnh). */
const MULTIPLIER_DAMPING = 0.55;

function dampCombinedMultiplier(product) {
  return 1 + (product - 1) * MULTIPLIER_DAMPING;
}

/**
 * Giải thích hệ số lấp đầy (đồng bộ với occupancyMultiplier)
 */
function describeOccupancyFactor(rate, mult) {
  const pct = Math.round(rate * 1000) / 10;
  if (rate >= 0.9) {
    return `Lấp đầy ${pct}% (≥90%) → hệ số ${mult}: tăng giá khi gần hết phòng.`;
  }
  if (rate >= 0.75) {
    return `Lấp đầy ${pct}% (≥75%) → hệ số ${mult}: tăng nhẹ theo nhu cầu.`;
  }
  if (rate >= 0.5) {
    return `Lấp đầy ${pct}% (≥50%) → hệ số ${mult}: điều chỉnh rất nhẹ.`;
  }
  if (rate <= 0.15) {
    return `Lấp đầy ${pct}% (≤15%) → hệ số ${mult}: giảm giá để kích cầu khi còn nhiều phòng trống.`;
  }
  if (rate <= 0.25) {
    return `Lấp đầy ${pct}% (≤25%) → hệ số ${mult}: giảm nhẹ.`;
  }
  return `Lấp đầy ${pct}% (vùng trung bình) → hệ số ${mult}: không điều chỉnh theo tỷ lệ.`;
}

/**
 * Giải thích hệ số mùa (đồng bộ với seasonMultiplierForDateKey)
 */
function describeSeasonFactor(dateKey, mult) {
  const [, m, d] = dateKey.split("-").map(Number);
  const month = m;
  const day = d;
  if (month === 12 && day >= 20) {
    return `Ngày thuộc giai đoạn cao điểm cuối năm (từ 20/12) → hệ số ${mult}.`;
  }
  if (month === 1 && day <= 5) {
    return `Ngày thuộc giai đoạn đầu năm (đến 05/01) → hệ số ${mult}.`;
  }
  if (month === 4 && day >= 28 && day <= 30) {
    return `Ngày lễ 30/4 → hệ số ${mult}.`;
  }
  if (month === 5 && day <= 2) {
    return `Ngày lễ 01/05 → hệ số ${mult}.`;
  }
  if (month >= 6 && month <= 8) {
    return `Tháng 6–8 (mùa hè) → hệ số ${mult}.`;
  }
  return `Ngày thường (không thuộc quy tắc mùa/lễ đã cài) → hệ số ${mult}.`;
}

/**
 * Giải thích hệ số theo thứ (lịch sử 84 ngày)
 */
function describeHistoricalWeekdayFactor(weekdayNightCounts, wd, hist) {
  const maxC = Math.max(...weekdayNightCounts, 0);
  const label = WD_LABEL_VI[wd];
  const c = weekdayNightCounts[wd] ?? 0;
  if (maxC === 0) {
    return `Chưa có đủ lịch sử đặt trong ${LOOKBACK_DAYS} ngày gần nhất → hệ số 1.00 cho mọi thứ.`;
  }
  return `Trong ${LOOKBACK_DAYS} ngày gần nhất: ${label} có ${c} đêm đã bán (cao nhất trong các thứ là ${maxC}). Hệ số ${(Math.round(hist * 1000) / 1000).toFixed(3)} phản ánh mức nhu cầu so với các thứ khác.`;
}

/**
 * Giải thích chuỗi: hệ số gộp → làm mượt → giá TB × hệ số → kẹp 75%–135% → làm tròn.
 */
function describeSuggestedFormula({
  avgCurrentNightly,
  rawProduct,
  dampedMult,
  rawBeforeClamp,
  afterClamp,
  suggestedNightly,
  minP,
  maxP,
}) {
  const parts = [];
  parts.push(
    `Tích hệ số (occ × mùa × thứ) = ${rawProduct.toFixed(3)}; làm mượt (${Math.round(MULTIPLIER_DAMPING * 100)}% hướng về 1) → hệ số nhân ≈ ${dampedMult.toFixed(3)}.`
  );
  parts.push(
    `Giá TB loại (${Math.round(avgCurrentNightly)}đ) × hệ số nhân ≈ ${Math.round(rawBeforeClamp)}đ.`
  );
  const wasClamped = rawBeforeClamp < minP || rawBeforeClamp > maxP;
  if (wasClamped) {
    parts.push(
      `Kẹp biên an toàn 75%–135% so với giá TB (${Math.round(minP)}–${Math.round(maxP)}đ) → ${Math.round(afterClamp)}đ.`
    );
  } else {
    parts.push(
      `Nằm trong biên 75%–135% giá TB (${Math.round(minP)}–${Math.round(maxP)}đ) → ${Math.round(afterClamp)}đ.`
    );
  }
  parts.push(`Làm tròn theo bước 10.000đ → ${suggestedNightly}đ.`);
  return parts.join(" ");
}

function groupRoomsByType(rooms) {
  /** @type {Record<string, typeof rooms>} */
  const map = {};
  for (const r of rooms) {
    const t = r.type;
    if (!map[t]) map[t] = [];
    map[t].push(r);
  }
  return map;
}

/**
 * Một query booking giao với [todayStartVN, todayStartVN + days), sau đó đếm phòng đang chiếm
 * theo từng đêm VN và từng loại (trùng điều kiện overlap countDocuments cũ).
 * @returns {{ nightSlots: Array<{ dateKey: string, nightStart: Date, nightEnd: Date }>, occupiedByTypeDay: Record<string, number[]> }}
 */
async function buildOccupiedRoomsByTypeAndDay(hotelId, rooms, types, days, todayStartVN) {
  const allRoomIds = rooms.map((r) => r._id);
  const rangeEnd = new Date(todayStartVN.getTime() + days * 86400000);

  const nightSlots = [];
  for (let i = 0; i < days; i++) {
    const cursor = new Date(todayStartVN.getTime() + i * 86400000);
    const dateKey = vnDateKey(cursor);
    const { start: nightStart, end: nightEnd } = vnDayBoundsFromKey(dateKey);
    nightSlots.push({ dateKey, nightStart, nightEnd });
  }

  /** @type {Record<string, number[]>} */
  const occupiedByTypeDay = {};
  for (const t of types) {
    occupiedByTypeDay[t] = new Array(days).fill(0);
  }

  const roomIdToType = new Map(rooms.map((r) => [r._id.toString(), r.type]));

  const overlapBookings = await Booking.find({
    hotel: hotelId,
    room: { $in: allRoomIds },
    paymentStatus: { $in: ["paid", "pending"] },
    checkInDate: { $lt: rangeEnd },
    checkOutDate: { $gt: todayStartVN },
  })
    .select("room checkInDate checkOutDate")
    .lean();

  for (const b of overlapBookings) {
    const rt = roomIdToType.get(String(b.room));
    if (!rt || !occupiedByTypeDay[rt]) continue;
    const cin = b.checkInDate;
    const cout = b.checkOutDate;
    const row = occupiedByTypeDay[rt];
    for (let i = 0; i < days; i++) {
      const { nightStart, nightEnd } = nightSlots[i];
      if (cin < nightEnd && cout > nightStart) row[i]++;
    }
  }

  return { nightSlots, occupiedByTypeDay };
}

function orderedRoomTypes(roomsByType) {
  const keys = new Set(Object.keys(roomsByType));
  const ordered = ROOM_TYPE_ORDER.filter((t) => keys.has(t));
  for (const k of keys) {
    if (!ordered.includes(k)) ordered.push(k);
  }
  return ordered;
}

/** Khôi phục giá phòng từ snapshot khi cần rollback (đường không transaction). */
async function rollbackRoomPricesFromSnapshot(roomsBefore) {
  if (!roomsBefore?.length) return;
  await Room.bulkWrite(
    roomsBefore.map((r) => ({
      updateOne: {
        filter: { _id: r._id },
        update: {
          $set: {
            price: readRoomPrice(r.price),
          },
        },
      },
    }))
  );
}

/** MongoDB standalone không hỗ trợ transaction; replica set / Atlas thường hỗ trợ. */
function isTransactionUnsupportedError(err) {
  if (!err) return false;
  const code = err.code;
  const msg = String(err.message || "");
  const name = String(err.codeName || "");
  return (
    code === 20 ||
    code === 303 ||
    name === "IllegalOperation" ||
    /replica set|mongos|Transaction numbers|multi-document transactions|not supported/i.test(msg)
  );
}

/** TB giá đêm (price) từ snapshot Hotel. */
function normalizeLastBulkApplyFromDoc(raw) {
  if (!raw || !raw.lastBulkApplyAt) return null;
  const previousAvgNightly = raw.previousAvgNightly;
  const appliedAvgNightly = raw.appliedAvgNightly;
  const appliedNightly = raw.appliedNightly ?? appliedAvgNightly;
  return {
    lastBulkApplyAt: new Date(raw.lastBulkApplyAt).toISOString(),
    previousAvgNightly,
    appliedAvgNightly,
    appliedNightly,
    appliedDate: raw.appliedDate ?? null,
    applyMode: raw.applyMode ?? (raw.appliedDate ? "day" : "average"),
    daysWindow: raw.daysWindow,
  };
}

/**
 * Dynamic pricing theo ngày, tách theo loại phòng (rule-based).
 * @param {string} ownerId
 * @param {{ hotelId?: string, days?: number }} options
 */
async function getDynamicPricingForOwner(ownerId, options = {}) {
  const days = Math.min(Math.max(parseInt(options.days, 10) || 14, 7), 90);
  let hotelIds = await getOwnerHotelIds(ownerId);
  if (!hotelIds.length) {
    return { hotels: [], message: "Chưa có khách sạn" };
  }

  if (options.hotelId) {
    if (!mongoose.isValidObjectId(options.hotelId)) {
      throw new Error("hotelId không hợp lệ");
    }
    const allowed = hotelIds.some((id) => id.toString() === options.hotelId);
    if (!allowed) {
      throw new Error("Không tìm thấy khách sạn hoặc không có quyền");
    }
    hotelIds = [new mongoose.Types.ObjectId(String(options.hotelId))];
  }

  const lookbackStart = new Date();
  lookbackStart.setDate(lookbackStart.getDate() - LOOKBACK_DAYS);

  const hotelsOut = [];

  for (const hid of hotelIds) {
    const hotel = await Hotel.findById(hid).lean();
    if (!hotel) continue;

    const rooms = await Room.find({ hotelId: hid, roomStatus: "active" }).lean();
    if (!rooms.length) {
      hotelsOut.push({
        hotelId: hid.toString(),
        hotelName: hotel.name,
        roomTypes: [],
        summary: null,
        note: "Không có phòng đang hoạt động",
      });
      continue;
    }

    const roomsByType = groupRoomsByType(rooms);
    const types = orderedRoomTypes(roomsByType);

    const paidBookings = await Booking.find({
      hotel: hid,
      paymentStatus: "paid",
      checkOutDate: { $gt: lookbackStart },
    })
      .select("checkInDate checkOutDate room")
      .populate("room", "type")
      .lean();

    const weekdayCountsByType = accumulateWeekdayNightCountsByType(paidBookings, lookbackStart);

    const todayKey = vnDateKey(new Date());
    const todayStartVN = new Date(`${todayKey}T00:00:00+07:00`);

    const { nightSlots, occupiedByTypeDay } = await buildOccupiedRoomsByTypeAndDay(
      hid,
      rooms,
      types,
      days,
      todayStartVN
    );

    /** @type {Array<{ type: string, typeLabel: string, roomCount: number, avgCurrentNightly: number, daily: object[], summary: object }>} */
    const roomTypesOut = [];
    let hotelTotalDelta = 0;

    for (const roomType of types) {
      const typeRooms = roomsByType[roomType];
      const totalRooms = typeRooms.length;
      const sumCurrent = typeRooms.reduce((s, r) => s + effectiveNightly(r), 0);
      const avgCurrentNightly = sumCurrent / totalRooms;

      const counts = weekdayCountsByType[roomType] || [0, 0, 0, 0, 0, 0, 0];
      const histMult = historicalWeekdayMultipliers(counts);

      const daily = [];
      let typeDeltaRevenue = 0;

      for (let i = 0; i < days; i++) {
        const { dateKey, nightStart } = nightSlots[i];
        const occupiedRooms = occupiedByTypeDay[roomType][i];

        const occupancyRate = totalRooms > 0 ? occupiedRooms / totalRooms : 0;
        const wd = vnWeekdayIndex(nightStart);
        const occMult = occupancyMultiplier(occupancyRate);
        const seaMult = seasonMultiplierForDateKey(dateKey);
        const hist = histMult[wd] ?? 1;

        const minP = avgCurrentNightly * 0.75;
        const maxP = avgCurrentNightly * 1.35;
        const rawProduct = occMult * seaMult * hist;
        const dampedMult = dampCombinedMultiplier(rawProduct);
        const rawBeforeClamp = avgCurrentNightly * dampedMult;
        const afterClamp = Math.min(maxP, Math.max(minP, rawBeforeClamp));
        const suggestedNightly = roundVnd(afterClamp);

        const deltaPerNight = suggestedNightly - avgCurrentNightly;
        typeDeltaRevenue += occupiedRooms * deltaPerNight;

        daily.push({
          date: dateKey,
          weekdayLabel: WD_LABEL_VI[wd],
          occupancyRate: Math.round(occupancyRate * 1000) / 1000,
          occupiedRooms,
          totalRooms,
          avgCurrentNightly: Math.round(avgCurrentNightly),
          suggestedNightly,
          factors: {
            occupancy: occMult,
            season: seaMult,
            historicalWeekday: Math.round(hist * 1000) / 1000,
          },
          factorBreakdown: {
            occupancy: {
              value: occMult,
              detail: describeOccupancyFactor(occupancyRate, occMult),
            },
            season: {
              value: seaMult,
              detail: describeSeasonFactor(dateKey, seaMult),
            },
            historicalWeekday: {
              value: Math.round(hist * 1000) / 1000,
              detail: describeHistoricalWeekdayFactor(counts, wd, hist),
            },
            formula: describeSuggestedFormula({
              avgCurrentNightly,
              rawProduct,
              dampedMult,
              rawBeforeClamp,
              afterClamp,
              suggestedNightly,
              minP,
              maxP,
            }),
          },
        });
      }

      hotelTotalDelta += typeDeltaRevenue;

      const metaByType =
        hotel.dynamicPricingByRoomType && typeof hotel.dynamicPricingByRoomType === "object"
          ? hotel.dynamicPricingByRoomType
          : {};
      const lastBulkRaw = metaByType[roomType];
      const lastBulkApply = normalizeLastBulkApplyFromDoc(lastBulkRaw);

      roomTypesOut.push({
        type: roomType,
        typeLabel: ROOM_TYPE_LABEL_VI[roomType] || roomType,
        roomCount: totalRooms,
        avgCurrentNightly: Math.round(avgCurrentNightly),
        daily,
        lastBulkApply,
        summary: {
          estimatedAdditionalRevenue: Math.round(typeDeltaRevenue),
          note:
            "Chênh lệch doanh thu ước tính cho loại phòng này: giữ nguyên số phòng đã đặt, chỉ đổi giá đêm TB của loại đó.",
        },
      });
    }

    hotelsOut.push({
      hotelId: hid.toString(),
      hotelName: hotel.name,
      from: todayKey,
      days,
      roomTypes: roomTypesOut,
      summary: {
        estimatedAdditionalRevenue: Math.round(hotelTotalDelta),
        note:
          "Tổng chênh lệch = cộng dồn theo từng loại phòng (mỗi loại có giá và tỷ lệ lấp đầy riêng). Giả định số phòng đã đặt không đổi.",
      },
    });
  }

  return { hotels: hotelsOut };
}

/**
 * Gán giá đêm (price) cho mọi phòng đang hoạt động của loại đó.
 * - Có `date`: dùng giá đề xuất đúng ngày đó.
 * - Không có `date`: dùng trung bình giá đề xuất trong kỳ `days` ngày (từ hôm nay, VN).
 * Đặt giá regular khớp mức gợi ý.
 */
async function applySuggestedPricesForOwner(ownerId, { hotelId, roomType, days, date }) {
  const d = Math.min(Math.max(parseInt(days, 10) || 14, 7), 90);
  if (!mongoose.isValidObjectId(hotelId)) {
    throw new Error("hotelId không hợp lệ");
  }
  if (!ROOM_TYPE_ORDER.includes(roomType)) {
    throw new Error("roomType không hợp lệ");
  }

  const hotelIds = await getOwnerHotelIds(ownerId);
  const allowed = hotelIds.some((id) => id.toString() === hotelId);
  if (!allowed) {
    throw new Error("Không tìm thấy khách sạn hoặc không có quyền");
  }

  const result = await getDynamicPricingForOwner(ownerId, { hotelId, days: d });
  const hotelBlock = result.hotels.find((h) => h.hotelId === hotelId);
  if (!hotelBlock) {
    throw new Error("Không tìm thấy dữ liệu khách sạn");
  }
  const rt = hotelBlock.roomTypes.find((r) => r.type === roomType);
  if (!rt || !rt.daily?.length) {
    throw new Error("Không có dữ liệu gợi ý cho loại phòng này");
  }

  let appliedPrice;
  let appliedDate = null;
  let applyMode = "average";

  if (date) {
    const dateKey = String(date).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
      throw new Error("date không hợp lệ (định dạng YYYY-MM-DD)");
    }
    const dayRow = rt.daily.find((row) => row.date === dateKey);
    if (!dayRow) {
      throw new Error(`Ngày ${dateKey} không nằm trong kỳ gợi ý đang xem (${d} ngày từ hôm nay)`);
    }
    appliedPrice = dayRow.suggestedNightly;
    appliedDate = dateKey;
    applyMode = "day";
  } else {
    const sum = rt.daily.reduce((s, row) => s + row.suggestedNightly, 0);
    appliedPrice = roundVnd(sum / rt.daily.length);
  }

  const roomsBefore = await Room.find({
    hotelId: new mongoose.Types.ObjectId(String(hotelId)),
    type: roomType,
    roomStatus: "active",
  })
    .select("_id price")
    .lean();

  if (!roomsBefore.length) {
    throw new Error("Không có phòng đang hoạt động cho loại này");
  }

  const sumPrev = roomsBefore.reduce((s, r) => s + effectiveNightly(r), 0);
  const previousAvgNightly = roundVnd(sumPrev / roomsBefore.length);

  const hotelExists = await Hotel.findById(hotelId).select("_id").lean();
  if (!hotelExists) {
    throw new Error("Không tìm thấy khách sạn");
  }

  const hotelOid = new mongoose.Types.ObjectId(String(hotelId));
  const appliedAt = new Date();
  const metaPayload = {
    lastBulkApplyAt: appliedAt,
    previousAvgNightly,
    appliedAvgNightly: appliedPrice,
    appliedNightly: appliedPrice,
    appliedDate,
    applyMode,
    daysWindow: d,
  };

  const roomFilter = {
    hotelId: hotelOid,
    type: roomType,
    roomStatus: "active",
  };
  const roomUpdate = { $set: { price: appliedPrice } };

  let updateRes;

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      updateRes = await Room.updateMany(roomFilter, roomUpdate, { session });
      await Hotel.findByIdAndUpdate(
        hotelId,
        { $set: { [`dynamicPricingByRoomType.${roomType}`]: metaPayload } },
        { session }
      );
    });
  } catch (err) {
    if (isTransactionUnsupportedError(err)) {
      updateRes = await Room.updateMany(roomFilter, roomUpdate);
      try {
        await Hotel.findByIdAndUpdate(hotelId, {
          $set: { [`dynamicPricingByRoomType.${roomType}`]: metaPayload },
        });
      } catch (hotelErr) {
        await rollbackRoomPricesFromSnapshot(roomsBefore);
        const wrapped = new Error(
          `Đã hoàn tác cập nhật giá phòng do lỗi lưu lịch sử khách sạn: ${hotelErr.message}`
        );
        wrapped.cause = hotelErr;
        throw wrapped;
      }
    } else {
      throw err;
    }
  } finally {
    await session.endSession();
  }

  const lastBulkApply = normalizeLastBulkApplyFromDoc(metaPayload);

  return {
    ok: true,
    hotelId,
    roomType,
    roomTypeLabel: rt.typeLabel,
    days: d,
    applyMode,
    appliedDate,
    appliedNightly: appliedPrice,
    avgSuggestedPrice: appliedPrice,
    previousAvgNightly,
    lastBulkApply,
    roomsUpdated: updateRes.modifiedCount ?? updateRes.nModified ?? 0,
    matchedCount: updateRes.matchedCount ?? updateRes.n ?? 0,
  };
}

module.exports = {
  getDynamicPricingForOwner,
  applySuggestedPricesForOwner,
  ROOM_TYPE_LABEL_VI,
};
