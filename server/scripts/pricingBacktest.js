 /**
 * Backtest định giá động — một file duy nhất: chuẩn bị data + chạy thí nghiệm + phân tích.
 *
 * Quy trình chuẩn (bộ data cuối cùng):
 *   npm run db:pricing-backtest -- --prepare-data   # xóa data backtest cũ, tạo lại 180 ngày
 *   npm run db:pricing-backtest                     # chạy backtest 90 ngày
 *
 * Phạm vi mặc định: 1 khách sạn (KS đầu tiên của owner) × 1 loại phòng (standard).
 * Khớp production: owner chọn 1 KS → xem/áp giá gợi ý cho 1 loại phòng cụ thể.
 *
 * Tuỳ chọn:
 *   --days=90            Số ngày đánh giá (mặc định 90)
 *   --history=180        Số ngày quá khứ khi prepare (mặc định 180)
 *   --hotelId=<id>       Khách sạn cần test (mặc định: KS đầu tiên của owner)
 *   --roomType=standard  Loại phòng cần test (mặc định: standard)
 *   --elasticity=0.7     Hệ số đàn hồi hai chiều (mặc định 0.7, luôn bật)
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const fs = require("fs");
const path = require("path");
const mongoose = require("mongoose");

const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const PaymentTransaction = require("../models/PaymentTransaction");
const { readRoomPrice } = require("../services/rooms/roomPrice");
const { ROOM_TYPE_ORDER, ROOM_TYPE_LABEL_VI } = require("../services/rooms/roomTypes");
const {
  vnDateKey,
  vnDayBoundsFromKey,
  vnWeekdayIndex,
  accumulateWeekdayNightCountsByType,
  historicalWeekdayMultipliers,
  computeSuggestedNightly,
  seasonMultiplierForDateKey,
  LOOKBACK_DAYS,
} = require("../services/pricing/pricingRules");
const {
  addDays,
  randomInt,
  pickOne,
  generateTransactionRef,
  datesOverlap,
} = require("./helpers");

// ─── Cấu hình bộ data backtest ─────────────────────────────────────────────
const BACKTEST_MARKER = "__PRICING_BACKTEST__";
const OWNER_EMAIL = "nhtquangforwork@gmail.com";
const DEFAULT_EVAL_DAYS = 90;
const DEFAULT_HISTORY_DAYS = 180;
const DEFAULT_ELASTICITY = 0.7;
const DEFAULT_ROOM_TYPE = "standard";
const INSERT_CHUNK = 400;
const WD_LABEL_VI = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

const SCENARIOS = {
  fixed: {
    id: "fixed",
    label: "Giá cố định (baseline)",
    factors: { occupancy: false, season: false, historicalWeekday: false },
  },
  full: {
    id: "full",
    label: "Đa hệ số đầy đủ (thuật toán hiện tại)",
    factors: { occupancy: true, season: true, historicalWeekday: true },
  },
  occ_only: {
    id: "occ_only",
    label: "Chỉ hệ số lấp đầy",
    factors: { occupancy: true, season: false, historicalWeekday: false },
  },
  season_only: {
    id: "season_only",
    label: "Chỉ hệ số mùa/lễ",
    factors: { occupancy: false, season: true, historicalWeekday: false },
  },
  weekday_only: {
    id: "weekday_only",
    label: "Chỉ hệ số thứ (lịch sử)",
    factors: { occupancy: false, season: false, historicalWeekday: true },
  },
};

function parseArgs(argv) {
  const out = {
    days: DEFAULT_EVAL_DAYS,
    history: DEFAULT_HISTORY_DAYS,
    hotelId: null,
    roomType: DEFAULT_ROOM_TYPE,
    prepareData: false,
    elasticity: DEFAULT_ELASTICITY,
  };
  for (const arg of argv) {
    if (arg === "--prepare-data") out.prepareData = true;
    else if (arg.startsWith("--days=")) out.days = parseInt(arg.split("=")[1], 10);
    else if (arg.startsWith("--history=")) out.history = parseInt(arg.split("=")[1], 10);
    else if (arg.startsWith("--elasticity=")) out.elasticity = parseFloat(arg.split("=")[1]);
    else if (arg.startsWith("--hotelId=")) out.hotelId = arg.split("=")[1];
    else if (arg.startsWith("--roomType=")) out.roomType = arg.split("=")[1].trim().toLowerCase();
  }
  return out;
}

/**
 * Mô hình đàn hồi cầu hai chiều (đối xứng quanh baseline):
 * - Giảm giá X% → bán thêm e×X% số phòng trống.
 * - Tăng giá X% → mất e×X% số phòng đang bận (khách bỏ đặt vì đắt).
 * e=0.7: đổi giá 10% → phản ứng cầu ~7% (trên phòng trống hoặc phòng đang bận).
 */
function estimateSoldWithElasticity(occupied, totalRooms, baselinePrice, suggestedPrice, elasticity) {
  if (!baselinePrice || baselinePrice <= 0) return occupied;

  const vacant = Math.max(0, totalRooms - occupied);
  const priceChange = (suggestedPrice - baselinePrice) / baselinePrice;

  if (Math.abs(priceChange) < 1e-9) return occupied;

  if (priceChange < 0) {
    const dropPct = -priceChange;
    const extra = vacant * elasticity * dropPct;
    return Math.min(totalRooms, occupied + extra);
  }

  const risePct = priceChange;
  const lost = occupied * elasticity * risePct;
  return Math.max(0, occupied - lost);
}

function formatVnd(n) {
  return Number(n).toLocaleString("vi-VN");
}

// ─── Chuẩn bị dữ liệu ───────────────────────────────────────────────────────

function targetOccupancyRate(nightDate) {
  const wd = vnWeekdayIndex(nightDate);
  const month = Number(vnDateKey(nightDate).split("-")[1]);
  let rate = 0.42;
  if (wd === 2 || wd === 3) rate += 0.22;
  else if (wd === 1 || wd === 4) rate += 0.12;
  else if (wd === 5) rate += 0.05;
  else if (wd === 0 || wd === 6) rate -= 0.12;
  if (month >= 6 && month <= 8) rate += 0.1;
  if (month === 12) rate += 0.08;
  if (month === 1 && Number(vnDateKey(nightDate).split("-")[2]) <= 5) rate += 0.06;
  if (month === 4 || month === 5) rate += 0.04;
  rate += (Math.random() - 0.5) * 0.1;
  return Math.min(0.9, Math.max(0.18, rate));
}

function buildRoomSchedule(bookings) {
  const byRoom = new Map();
  for (const b of bookings) {
    const key = String(b.room);
    if (!byRoom.has(key)) byRoom.set(key, []);
    byRoom.get(key).push({
      checkInDate: new Date(b.checkInDate),
      checkOutDate: new Date(b.checkOutDate),
    });
  }
  return byRoom;
}

function roomFreeForStay(roomId, checkIn, checkOut, schedule) {
  const ranges = schedule.get(String(roomId)) || [];
  return !ranges.some((r) => datesOverlap(checkIn, checkOut, r.checkInDate, r.checkOutDate));
}

function nightOverlaps(nightStart, nightEnd, checkIn, checkOut) {
  return checkIn < nightEnd && checkOut > nightStart;
}

function countOccupiedOnNight(rooms, schedule, nightStart, nightEnd) {
  let n = 0;
  for (const room of rooms) {
    const ranges = schedule.get(String(room._id)) || [];
    if (ranges.some((r) => nightOverlaps(nightStart, nightEnd, r.checkInDate, r.checkOutDate))) {
      n += 1;
    }
  }
  return n;
}

function vnNightBounds(dateKey) {
  const start = new Date(`${dateKey}T00:00:00+07:00`);
  return { nightStart: start, nightEnd: new Date(start.getTime() + 86400000) };
}

/** Một KS duy nhất — khớp luồng owner chọn KS rồi áp giá cho từng loại phòng. */
async function resolveBacktestHotel(hotelId) {
  if (hotelId) {
    const h = await Hotel.findById(hotelId);
    if (!h) throw new Error(`Không tìm thấy hotelId ${hotelId}`);
    return h;
  }
  const owner = await User.findOne({ email: OWNER_EMAIL.toLowerCase(), role: "owner" });
  if (!owner) throw new Error(`Không tìm thấy owner ${OWNER_EMAIL}. Chạy db:seed trước.`);
  const hotel = await Hotel.findOne({ ownerId: owner._id }).sort({ createdAt: 1 }).lean();
  if (!hotel) throw new Error("Owner chưa có khách sạn.");
  return hotel;
}

async function purgeBacktestBookings() {
  const old = await Booking.find({ specialRequests: BACKTEST_MARKER }).select("_id").lean();
  if (!old.length) return 0;
  const ids = old.map((b) => b._id);
  await PaymentTransaction.deleteMany({ booking: { $in: ids } });
  await Booking.deleteMany({ _id: { $in: ids } });
  return ids.length;
}

/** Xóa booking paid/pending lịch sử (không phải marker) trên KS owner — tránh data seed dư chặn phòng. */
async function purgeOwnerHistoricalNoise(hotelIds, historyDays) {
  const todayStart = new Date(`${vnDateKey(new Date())}T00:00:00+07:00`);
  const rangeStart = addDays(todayStart, -historyDays);

  const old = await Booking.find({
    hotel: { $in: hotelIds },
    paymentStatus: { $in: ["paid", "pending"] },
    specialRequests: { $ne: BACKTEST_MARKER },
    checkInDate: { $lt: todayStart },
    checkOutDate: { $gt: rangeStart },
  })
    .select("_id")
    .lean();

  if (!old.length) return 0;
  const ids = old.map((b) => b._id);
  await PaymentTransaction.deleteMany({ booking: { $in: ids } });
  await Booking.deleteMany({ _id: { $in: ids } });
  return ids.length;
}

async function loadBlockingBookings(hotelId) {
  return Booking.find({
    hotel: hotelId,
    paymentStatus: { $in: ["paid", "pending"] },
    specialRequests: BACKTEST_MARKER,
  })
    .select("room checkInDate checkOutDate")
    .lean();
}

async function generatePatternBookings(hotel, guests, historyDays) {
  const rooms = await Room.find({ hotelId: hotel._id, roomStatus: "active" }).lean();
  if (!rooms.length || !guests.length) return [];

  const todayStart = new Date(`${vnDateKey(new Date())}T00:00:00+07:00`);
  const schedule = buildRoomSchedule(await loadBlockingBookings(hotel._id));
  const payloads = [];

  for (let d = historyDays; d >= 1; d -= 1) {
    const nightDate = addDays(todayStart, -d);
    const dateKey = vnDateKey(nightDate);
    const { nightStart, nightEnd } = vnNightBounds(dateKey);
    const targetOccupied = Math.round(rooms.length * targetOccupancyRate(nightDate));
    let need = Math.max(0, targetOccupied - countOccupiedOnNight(rooms, schedule, nightStart, nightEnd));

    for (const room of [...rooms].sort(() => Math.random() - 0.5)) {
      if (need <= 0) break;
      if (!roomFreeForStay(room._id, nightStart, nightEnd, schedule)) continue;

      let nights = 1;
      const maxNights = Math.min(need > 2 ? randomInt(1, 3) : 1, historyDays - d + 1);
      for (let n = maxNights; n >= 1; n -= 1) {
        const tryOut = new Date(nightStart.getTime() + n * 86400000);
        if (roomFreeForStay(room._id, nightStart, tryOut, schedule)) {
          nights = n;
          break;
        }
      }

      const checkIn = new Date(nightStart);
      checkIn.setHours(14, 0, 0, 0);
      const checkOut = addDays(checkIn, nights);
      checkOut.setHours(12, 0, 0, 0);
      if (!roomFreeForStay(room._id, checkIn, checkOut, schedule)) continue;

      const basePrice = room.price * nights;
      payloads.push({
        guest: pickOne(guests)._id,
        hotel: hotel._id,
        room: room._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        basePrice,
        discountAmount: 0,
        finalAmount: basePrice,
        paymentStatus: "paid",
        paymentMethod: Math.random() < 0.55 ? "qr_code" : "vnpay",
        specialRequests: BACKTEST_MARKER,
        checkedInAt: (() => {
          const t = new Date(checkIn);
          t.setHours(15, 0, 0, 0);
          return t;
        })(),
        checkedOutAt: (() => {
          const t = new Date(checkOut);
          t.setHours(11, 0, 0, 0);
          return t;
        })(),
      });

      const key = String(room._id);
      if (!schedule.has(key)) schedule.set(key, []);
      schedule.get(key).push({ checkInDate: checkIn, checkOutDate: checkOut });
      need -= nights;
    }
  }
  return payloads;
}

async function insertBookingsChunk(payloads, startIndex) {
  if (!payloads.length) return 0;
  const bookings = await Booking.insertMany(payloads, { ordered: false });
  await PaymentTransaction.insertMany(
    bookings.map((booking, index) => ({
      booking: booking._id,
      transactionRef: generateTransactionRef(booking._id, startIndex + index),
      amount: booking.finalAmount,
      paymentMethod: booking.paymentMethod,
      status: "success",
      clientIp: `10.0.${randomInt(1, 254)}.${randomInt(1, 254)}`,
      ...(booking.paymentMethod === "vnpay"
        ? {
            vnpResponseCode: "00",
            vnpTransactionStatus: "00",
            vnpBankCode: "NCB",
            vnpCardType: "ATM",
            vnpTxnRef: generateTransactionRef(booking._id, startIndex + index + 5000),
          }
        : {}),
    }))
  );
  return bookings.length;
}

async function prepareBacktestData({ historyDays, hotelId }) {
  const hotel = await resolveBacktestHotel(hotelId);
  const hotelIds = [hotel._id];

  const removedMarker = await purgeBacktestBookings();
  const removedNoise = await purgeOwnerHistoricalNoise(hotelIds, historyDays);

  const guests = await User.find({ role: "guest", status: "active" }).select("_id").lean();
  if (!guests.length) throw new Error("Không có guest. Chạy db:seed trước.");

  console.log(`\n── Chuẩn bị bộ data backtest (${historyDays} ngày) ──`);
  if (removedMarker) console.log(`  Xóa ${removedMarker} booking backtest cũ`);
  if (removedNoise) console.log(`  Xóa ${removedNoise} booking seed dư trên KS owner (trong kỳ lịch sử)`);

  let total = 0;
  let pending = [];
  const payloads = await generatePatternBookings(hotel, guests, historyDays);
  pending.push(...payloads);
  console.log(`  • ${hotel.name}: ${payloads.length} đơn paid`);
  while (pending.length >= INSERT_CHUNK) {
    const chunk = pending.splice(0, INSERT_CHUNK);
    total += await insertBookingsChunk(chunk, total);
  }
  if (pending.length) total += await insertBookingsChunk(pending, total);

  console.log(`  ✓ Bộ data cuối: ${total} booking paid trên "${hotel.name}"\n`);
  return { hotel: { id: String(hotel._id), name: hotel.name }, bookingCount: total };
}

// ─── Engine backtest ──────────────────────────────────────────────────────────

function groupRoomsByType(rooms) {
  const map = {};
  for (const r of rooms) {
    if (!map[r.type]) map[r.type] = [];
    map[r.type].push(r);
  }
  return map;
}

function orderedRoomTypes(roomsByType) {
  const keys = new Set(Object.keys(roomsByType));
  const ordered = ROOM_TYPE_ORDER.filter((t) => keys.has(t));
  for (const k of keys) {
    if (!ordered.includes(k)) ordered.push(k);
  }
  return ordered;
}

function emptyMetrics() {
  return { totalRevenue: 0, roomNightsSold: 0, roomNightsAvailable: 0, revpar: 0, adr: 0, occupancyPct: 0 };
}

function finalizeMetrics(m) {
  if (m.roomNightsAvailable > 0) {
    m.revpar = m.totalRevenue / m.roomNightsAvailable;
    m.occupancyPct = (m.roomNightsSold / m.roomNightsAvailable) * 100;
  }
  if (m.roomNightsSold > 0) m.adr = m.totalRevenue / m.roomNightsSold;
  m.totalRevenue = Math.round(m.totalRevenue);
  m.revpar = Math.round(m.revpar);
  m.adr = Math.round(m.adr);
  m.occupancyPct = Math.round(m.occupancyPct * 10) / 10;
  return m;
}

function buildScenariosOutput(scenarioMetrics, elasticMetrics, elasticity) {
  const fixedRevpar = finalizeMetrics(scenarioMetrics.fixed).revpar;
  const scenariosOut = {};
  for (const [id, m] of Object.entries(scenarioMetrics)) {
    const finalized = finalizeMetrics({ ...m });
    scenariosOut[id] = {
      ...SCENARIOS[id],
      metrics: finalized,
      upliftRevparPct:
        fixedRevpar > 0 ? Math.round(((finalized.revpar - fixedRevpar) / fixedRevpar) * 1000) / 10 : 0,
    };
  }
  const finalizedElastic = finalizeMetrics({ ...elasticMetrics });
  scenariosOut.full_elastic = {
    id: "full_elastic",
    label: `Đa hệ số + đàn hồi hai chiều (e=${elasticity})`,
    metrics: finalizedElastic,
    upliftRevparPct:
      fixedRevpar > 0 ? Math.round(((finalizedElastic.revpar - fixedRevpar) / fixedRevpar) * 1000) / 10 : 0,
    elasticity,
  };
  return scenariosOut;
}

function countBookingsByRoomType(bookings) {
  const counts = {};
  for (const b of bookings) {
    const rt = b.room?.type;
    if (!rt) continue;
    counts[rt] = (counts[rt] || 0) + 1;
  }
  return counts;
}

function buildOccupiedByTypeAndDay(bookings, rooms, types, nightSlots) {
  const roomIdToType = new Map(rooms.map((r) => [r._id.toString(), r.type]));
  const occupiedByTypeDay = {};
  for (const t of types) occupiedByTypeDay[t] = new Array(nightSlots.length).fill(0);
  for (const b of bookings) {
    const roomId = b.room?._id ? String(b.room._id) : String(b.room);
    const rt = roomIdToType.get(roomId);
    if (!rt || !occupiedByTypeDay[rt]) continue;
    const cin = new Date(b.checkInDate);
    const cout = new Date(b.checkOutDate);
    for (let i = 0; i < nightSlots.length; i++) {
      const { nightStart, nightEnd } = nightSlots[i];
      if (cin < nightEnd && cout > nightStart) occupiedByTypeDay[rt][i] += 1;
    }
  }
  return occupiedByTypeDay;
}

function addBucket(buckets, key, fixedRev, dynamicRev, sold, available) {
  if (!buckets[key]) {
    buckets[key] = { key, nights: 0, roomNightsSold: 0, roomNightsAvailable: 0, fixedRevenue: 0, dynamicRevenue: 0 };
  }
  const b = buckets[key];
  b.nights += 1;
  b.roomNightsSold += sold;
  b.roomNightsAvailable += available;
  b.fixedRevenue += fixedRev;
  b.dynamicRevenue += dynamicRev;
}

function summarizeBuckets(buckets) {
  return Object.values(buckets)
    .filter((b) => b && b.nights > 0)
    .map((b) => {
      const fixedRevpar = b.roomNightsAvailable > 0 ? b.fixedRevenue / b.roomNightsAvailable : 0;
      const dynamicRevpar = b.roomNightsAvailable > 0 ? b.dynamicRevenue / b.roomNightsAvailable : 0;
      const upliftPct = fixedRevpar > 0 ? ((dynamicRevpar - fixedRevpar) / fixedRevpar) * 100 : 0;
      return {
        ...b,
        fixedRevpar: Math.round(fixedRevpar),
        dynamicRevpar: Math.round(dynamicRevpar),
        upliftRevparPct: Math.round(upliftPct * 10) / 10,
        fixedRevenue: Math.round(b.fixedRevenue),
        dynamicRevenue: Math.round(b.dynamicRevenue),
      };
    });
}

async function resolveEvaluationWindow(evaluationDays) {
  const latest = await Booking.findOne({
    paymentStatus: "paid",
    specialRequests: BACKTEST_MARKER,
    checkOutDate: { $lte: new Date() },
  })
    .sort({ checkOutDate: -1 })
    .select("checkOutDate")
    .lean();

  const evalEndVN = latest
    ? new Date(`${vnDateKey(latest.checkOutDate)}T00:00:00+07:00`)
    : new Date(`${vnDateKey(new Date())}T00:00:00+07:00`);
  evalEndVN.setTime(evalEndVN.getTime() + 86400000);
  const evalStartVN = new Date(evalEndVN.getTime() - evaluationDays * 86400000);
  return { evalStartVN, evalEndVN };
}

async function backtestSingleRoomType(hotelId, roomType, evalStartVN, evalEndVN, elasticity = DEFAULT_ELASTICITY) {
  const hotel = await Hotel.findById(hotelId).lean();
  if (!hotel) return null;

  const rooms = await Room.find({ hotelId, roomStatus: "active" }).lean();
  if (!rooms.length) return null;

  const roomsByType = groupRoomsByType(rooms);
  if (!roomsByType[roomType]?.length) {
    const available = orderedRoomTypes(roomsByType).join(", ");
    throw new Error(
      `Khách sạn "${hotel.name}" không có loại phòng "${roomType}". Có sẵn: ${available || "(trống)"}`
    );
  }

  const types = [roomType];
  const baselineByType = {};
  for (const t of types) {
    baselineByType[t] = roomsByType[t].reduce((s, r) => s + readRoomPrice(r.price), 0) / roomsByType[t].length;
  }

  const lookbackStart = new Date(evalStartVN.getTime() - LOOKBACK_DAYS * 86400000);
  const paidBookings = await Booking.find({
    hotel: hotelId,
    paymentStatus: "paid",
    specialRequests: BACKTEST_MARKER,
    checkOutDate: { $gt: lookbackStart },
    checkInDate: { $lt: evalEndVN },
  })
    .select("checkInDate checkOutDate room")
    .populate("room", "type")
    .lean();

  const nightSlots = [];
  for (let c = new Date(evalStartVN); c < evalEndVN; c = new Date(c.getTime() + 86400000)) {
    const dateKey = vnDateKey(c);
    const { start: nightStart, end: nightEnd } = vnDayBoundsFromKey(dateKey);
    nightSlots.push({ dateKey, nightStart, nightEnd });
  }
  if (!nightSlots.length) return null;

  const occupiedByTypeDay = buildOccupiedByTypeAndDay(paidBookings, rooms, types, nightSlots);
  const bookingsByType = countBookingsByRoomType(paidBookings);

  const perType = {};
  for (const roomType of types) {
    perType[roomType] = {
      scenarioMetrics: Object.fromEntries(Object.keys(SCENARIOS).map((k) => [k, emptyMetrics()])),
      elasticMetrics: emptyMetrics(),
      buckets: { occupancy: {}, season: {}, weekday: {} },
    };
  }

  for (let i = 0; i < nightSlots.length; i++) {
    const { dateKey, nightStart } = nightSlots[i];
    const lbStart = new Date(nightStart.getTime() - LOOKBACK_DAYS * 86400000);
    const wdCounts = accumulateWeekdayNightCountsByType(paidBookings, lbStart, nightStart);
    const wd = vnWeekdayIndex(nightStart);

    for (const roomType of types) {
      const totalRooms = roomsByType[roomType].length;
      if (!totalRooms) continue;

      const block = perType[roomType];
      const occupied = occupiedByTypeDay[roomType][i];
      const occupancyRate = occupied / totalRooms;
      const avgBaseline = baselineByType[roomType];
      const counts = wdCounts[roomType] || [0, 0, 0, 0, 0, 0, 0];
      const histMult = historicalWeekdayMultipliers(counts)[wd] ?? 1;

      const prices = {};
      for (const sid of Object.keys(SCENARIOS)) {
        prices[sid] =
          sid === "fixed"
            ? Math.round(avgBaseline)
            : computeSuggestedNightly(avgBaseline, {
                occupancyRate,
                dateKey,
                histMult,
                factors: SCENARIOS[sid].factors,
                useDamping: true,
              }).suggestedNightly;
      }

      for (const sid of Object.keys(SCENARIOS)) {
        const m = block.scenarioMetrics[sid];
        m.totalRevenue += occupied * prices[sid];
        m.roomNightsSold += occupied;
        m.roomNightsAvailable += totalRooms;
      }

      const soldElastic = estimateSoldWithElasticity(
        occupied,
        totalRooms,
        prices.fixed,
        prices.full,
        elasticity
      );
      block.elasticMetrics.totalRevenue += soldElastic * prices.full;
      block.elasticMetrics.roomNightsSold += soldElastic;
      block.elasticMetrics.roomNightsAvailable += totalRooms;

      const occBand = occupancyRate <= 0.25 ? "low" : occupancyRate >= 0.75 ? "high" : "mid";
      const seaBand = seasonMultiplierForDateKey(dateKey) > 1 ? "peak" : "normal";
      addBucket(block.buckets.occupancy, occBand, occupied * prices.fixed, occupied * prices.full, occupied, totalRooms);
      addBucket(block.buckets.season, seaBand, occupied * prices.fixed, occupied * prices.full, occupied, totalRooms);
      addBucket(block.buckets.weekday, WD_LABEL_VI[wd], occupied * prices.fixed, occupied * prices.full, occupied, totalRooms);
    }
  }

  const block = perType[roomType];
  const scenarios = buildScenariosOutput(block.scenarioMetrics, block.elasticMetrics, elasticity);

  return {
    hotelId: String(hotelId),
    hotelName: hotel.name,
    roomType,
    typeLabel: ROOM_TYPE_LABEL_VI[roomType] || roomType,
    roomCount: roomsByType[roomType].length,
    avgBaselineNightly: Math.round(baselineByType[roomType]),
    paidBookingsUsed: bookingsByType[roomType] || 0,
    evaluationNights: nightSlots.length,
    scenarios,
    insights: {
      byOccupancyBand: summarizeBuckets(block.buckets.occupancy),
      bySeasonBand: summarizeBuckets(block.buckets.season),
      byWeekday: summarizeBuckets(block.buckets.weekday),
    },
  };
}

async function runBacktest({ evaluationDays, hotelId, roomType, elasticity }) {
  const days = Math.min(Math.max(evaluationDays || DEFAULT_EVAL_DAYS, 30), 180);
  const e = elasticity ?? DEFAULT_ELASTICITY;
  const targetRoomType = (roomType || DEFAULT_ROOM_TYPE).toLowerCase();
  const { evalStartVN, evalEndVN } = await resolveEvaluationWindow(days);
  const hotel = await resolveBacktestHotel(hotelId);

  const result = await backtestSingleRoomType(hotel._id, targetRoomType, evalStartVN, evalEndVN, e);
  if (!result) {
    throw new Error(`Không thể chạy backtest trên khách sạn ${hotel.name || hotelId}`);
  }

  const assumptions = [
    "Phạm vi: 1 khách sạn × 1 loại phòng — khớp luồng owner chọn KS rồi xem giá gợi ý cho loại phòng đó.",
    "Chỉ dùng booking paid có marker __PRICING_BACKTEST__ (bộ data chuẩn, không lẫn seed ngẫu nhiên).",
    "Baseline = giá TB của loại phòng đang test, không đổi theo ngày.",
    "Doanh thu = số đêm-phòng bán của loại đó × giá gợi ý; RevPAR = doanh thu ÷ (số phòng loại × số đêm).",
    "Kịch bản ablation (occ/mùa/thứ): occupancy cố định — chỉ đổi giá (so sánh thiết kế).",
    "Kịch bản chính full_elastic: đàn hồi hai chiều — tăng giá ↓cầu, giảm giá ↑cầu.",
    `Hệ số đàn hồi e=${e}: đổi giá X% → phản ứng cầu ~e×X% (trên phòng trống hoặc phòng đang bận của loại đó).`,
    "Hệ số thứ: lookback 84 ngày theo loại phòng, kết thúc trước đêm đánh giá.",
  ];

  return {
    meta: {
      generatedAt: new Date().toISOString(),
      dataMarker: BACKTEST_MARKER,
      evaluationDays: days,
      lookbackDays: LOOKBACK_DAYS,
      evalFrom: vnDateKey(evalStartVN),
      evalTo: vnDateKey(new Date(evalEndVN.getTime() - 86400000)),
      targetHotelId: result.hotelId,
      targetHotelName: result.hotelName,
      targetRoomType: result.roomType,
      targetRoomTypeLabel: result.typeLabel,
      elasticity: e,
      assumptions,
      reportMode: "single_room_type",
    },
    result,
  };
}

// ─── Báo cáo & phân tích ─────────────────────────────────────────────────────

function printReport(payload) {
  const { meta, result } = payload;
  console.log("\n══════════════════════════════════════════════════════════");
  console.log("  BACKTEST ĐỊNH GIÁ ĐỘNG — 1 khách sạn × 1 loại phòng");
  console.log("══════════════════════════════════════════════════════════");
  console.log(`Data       : ${meta.dataMarker}`);
  console.log(`Kỳ         : ${meta.evalFrom} → ${meta.evalTo} (${meta.evaluationDays} đêm)`);
  console.log(`Elasticity : e=${meta.elasticity} (hai chiều, luôn bật)`);
  console.log(`Mục tiêu    : ${meta.targetHotelName} — ${meta.targetRoomTypeLabel} (${result.roomType})`);
  console.log(
    `           ${result.roomCount} phòng | ${result.paidBookingsUsed} đơn | baseline ${formatVnd(result.avgBaselineNightly)}đ/đêm`
  );

  for (const s of Object.values(result.scenarios)) {
    const m = s.metrics;
    const d = s.id === "fixed" ? "—" : `${s.upliftRevparPct >= 0 ? "+" : ""}${s.upliftRevparPct}%`;
    const mark = s.id === "full_elastic" ? " ★" : "";
    console.log(
      `  ${(s.label + mark).padEnd(36)} RevPAR ${formatVnd(m.revpar).padStart(10)} | Occ ${m.occupancyPct}% | Δ ${d}`
    );
  }
  const el = result.scenarios.full_elastic;
  console.log(`  ★ Elastic: Δ RevPAR ${el.upliftRevparPct >= 0 ? "+" : ""}${el.upliftRevparPct}%`);
}

function buildTargetResults(meta, result) {
  const lines = [];
  const s = result.scenarios;
  const elastic = s.full_elastic;
  const full = s.full;

  lines.push(`\n── KẾT QUẢ: ${meta.targetHotelName} — ${meta.targetRoomTypeLabel} ──\n`);
  lines.push(
    `  ${result.roomCount} phòng | ${result.paidBookingsUsed} đơn | baseline ${formatVnd(result.avgBaselineNightly)}đ/đêm | e=${meta.elasticity}`
  );
  lines.push("");
  for (const sc of Object.values(s)) {
    const m = sc.metrics;
    const d = sc.id === "fixed" ? "—" : `${sc.upliftRevparPct >= 0 ? "+" : ""}${sc.upliftRevparPct}%`;
    const mark = sc.id === "full_elastic" ? " ★" : "";
    lines.push(
      `  • ${sc.label}${mark}: RevPAR ${formatVnd(m.revpar)} | Occ ${m.occupancyPct}% | ADR ${formatVnd(m.adr)} | Δ ${d}`
    );
  }
  lines.push("");
  lines.push(
    `  Kết luận loại phòng: full_elastic ${elastic.upliftRevparPct >= 0 ? "+" : ""}${elastic.upliftRevparPct}% RevPAR; full (không elasticity) +${full.upliftRevparPct}%.`
  );

  const highOcc = result.insights.byOccupancyBand.find((r) => r.key === "high");
  const lowOcc = result.insights.byOccupancyBand.find((r) => r.key === "low");
  if (highOcc || lowOcc) {
    lines.push("\n  Theo mức lấp đầy (occupancy cố định, so thiết kế giá):");
    if (highOcc) lines.push(`    • Lấp đầy cao: Δ RevPAR ${highOcc.upliftRevparPct >= 0 ? "+" : ""}${highOcc.upliftRevparPct}%`);
    if (lowOcc) lines.push(`    • Lấp đầy thấp: Δ RevPAR ${lowOcc.upliftRevparPct >= 0 ? "+" : ""}${lowOcc.upliftRevparPct}%`);
  }

  return lines.join("\n");
}

function buildOverallConclusion(meta, result) {
  const elastic = result.scenarios.full_elastic;
  const full = result.scenarios.full;
  const highOcc = result.insights.byOccupancyBand.find((r) => r.key === "high");
  const lowOcc = result.insights.byOccupancyBand.find((r) => r.key === "low");

  const lines = [];
  lines.push(`\n── KẾT LUẬN ──\n`);
  lines.push(
    `Mục tiêu: "${meta.targetHotelName}" — loại ${meta.targetRoomTypeLabel} (${meta.targetRoomType}), ${meta.evaluationDays} đêm, e=${meta.elasticity}.`
  );
  lines.push("");
  lines.push(`1. Kịch bản thực tế ★ full_elastic: Δ RevPAR ${elastic.upliftRevparPct >= 0 ? "+" : ""}${elastic.upliftRevparPct}%`);
  lines.push(`2. Tham chiếu không elasticity (full): +${full.upliftRevparPct}% RevPAR`);

  if (highOcc || lowOcc) {
    lines.push("\n3. Xu hướng theo lấp đầy (occupancy cố định):");
    if (highOcc) lines.push(`   • Lấp đầy cao: Δ RevPAR ${highOcc.upliftRevparPct >= 0 ? "+" : ""}${highOcc.upliftRevparPct}%`);
    if (lowOcc) lines.push(`   • Lấp đầy thấp: Δ RevPAR ${lowOcc.upliftRevparPct >= 0 ? "+" : ""}${lowOcc.upliftRevparPct}%`);
  }

  lines.push("");
  if (elastic.upliftRevparPct > 0) {
    lines.push(
      `• Thuật toán CÓ HIỆU QUẢ cho loại phòng này: áp giá gợi ý vượt baseline +${elastic.upliftRevparPct}% RevPAR (có đàn hồi).`
    );
  } else {
    lines.push(
      `• Thuật toán CHƯA vượt baseline cho loại phòng này: Δ RevPAR ${elastic.upliftRevparPct}% (có đàn hồi).`
    );
  }
  lines.push("• Khớp production: owner chọn 1 KS → xem/áp giá gợi ý cho đúng loại phòng đang quản lý.");
  lines.push("• Muốn thử loại khác: chạy lại với --roomType=deluxe (cùng hoặc khác --hotelId).");

  return lines.join("\n");
}

function buildAnalysis(payload) {
  return [buildTargetResults(payload.meta, payload.result), buildOverallConclusion(payload.meta, payload.result)].join("\n");
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (!process.env.MONGO_URL) {
    console.error("Thiếu MONGO_URL trong .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL, {
    dbName: process.env.MONGO_DB_NAME || "StayJourney",
  });

  try {
    if (args.prepareData) {
      await prepareBacktestData({ historyDays: args.history, hotelId: args.hotelId });
    }

    console.log("Đang chạy backtest...");
    const payload = await runBacktest({
      evaluationDays: args.days,
      hotelId: args.hotelId,
      roomType: args.roomType,
      elasticity: args.elasticity,
    });

    if (!payload.result) {
      console.error("Không có data backtest. Chạy: npm run db:pricing-backtest -- --prepare-data");
      process.exit(1);
    }

    payload.overallConclusion = buildOverallConclusion(payload.meta, payload.result);
    payload.analysis = buildAnalysis(payload);

    const outDir = path.join(__dirname, "output");
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, "pricing-backtest-latest.json");
    fs.writeFileSync(outPath, JSON.stringify(payload, null, 2), "utf8");

    printReport(payload);
    console.log("\n" + "═".repeat(58));
    console.log("  PHÂN TÍCH CHI TIẾT");
    console.log("═".repeat(58));
    console.log(payload.analysis);
    console.log(`\nJSON: ${outPath}\n`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
