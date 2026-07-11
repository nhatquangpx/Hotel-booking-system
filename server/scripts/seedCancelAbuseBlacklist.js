/**
 * Seed dữ liệu test "Danh sách đen" (hủy đơn liên tục).
 *
 * Tạo guest + các booking đã hủy (guestCancelRequestedAt trong cửa sổ 7 ngày),
 * rồi chạy evaluateAfterGuestCancel để đưa vào hàng chờ admin.
 *
 * Chạy (từ thư mục server):
 *   node scripts/seedCancelAbuseBlacklist.js
 *   npm run db:seed-blacklist
 *
 * Yêu cầu: DB đã có ít nhất 1 hotel + room (sau db:seed / db:reseed).
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const CancelAbuseFlag = require("../models/CancelAbuseFlag");
const { hashPassword, addDays } = require("./helpers");
const { THRESHOLD, WINDOW_DAYS } = require("../services/moderation/cancelAbuseConfig");
const { evaluateAfterGuestCancel } = require("../services/moderation/cancelAbuseService");

const COMMON_PASSWORD = "123456";
const TARGET_HOTEL_NAME = "Silver Resort Nha Trang";

/** Email cố định để test — password: 123456 */
const TEST_GUESTS = {
  /** ≥ THRESHOLD hủy trong WINDOW_DAYS → vào danh sách đen (pending) */
  abuse: {
    email: "blacklist.abuse@stayjourney-seed.test",
    name: "Nguyễn Văn Lạm Dụng",
    phone: "0900111001",
    cancelCount: Math.max(THRESHOLD, 3),
  },
  /** Dưới ngưỡng → không tạo cờ */
  under: {
    email: "blacklist.under@stayjourney-seed.test",
    name: "Trần Thị Dưới Ngưỡng",
    phone: "0900111002",
    cancelCount: Math.max(1, THRESHOLD - 1),
  },
  /** Đủ ngưỡng + đã sanctioned sẵn (để test tab Đã cấm) */
  sanctioned: {
    email: "blacklist.sanctioned@stayjourney-seed.test",
    name: "Lê Văn Đã Cấm",
    phone: "0900111003",
    cancelCount: Math.max(THRESHOLD, 3),
  },
};

function roundToTenThousand(amount) {
  const n = Number(amount) || 0;
  if (n <= 0) return 0;
  return Math.max(10000, Math.round(n / 10000) * 10000);
}

async function findHotelWithRooms() {
  let hotel = await Hotel.findOne({ name: TARGET_HOTEL_NAME });
  if (!hotel) {
    hotel = await Hotel.findOne({ name: { $regex: /Silver Resort.*Nha Trang/i } });
  }
  if (!hotel) {
    hotel = await Hotel.findOne().sort({ createdAt: 1 });
  }
  if (!hotel) throw new Error("Không có khách sạn nào trong DB. Chạy npm run db:seed trước.");

  const rooms = await Room.find({ hotelId: hotel._id, roomStatus: "active" });
  if (rooms.length === 0) {
    throw new Error(`Khách sạn "${hotel.name}" chưa có phòng active.`);
  }
  return { hotel, rooms };
}

async function upsertGuest(profile) {
  const password = await hashPassword(COMMON_PASSWORD);
  let user = await User.findOne({ email: profile.email });
  if (user) {
    user.name = profile.name;
    user.phone = profile.phone;
    user.role = "guest";
    user.status = "active";
    user.inactiveUntil = null;
    user.inactiveReason = "";
    user.password = password;
    user.idNumber = user.idNumber || "001099001001";
    await user.save();
    return user;
  }

  try {
    return await User.create({
      name: profile.name,
      email: profile.email,
      phone: profile.phone,
      password,
      role: "guest",
      status: "active",
      idNumber: "001099001001",
    });
  } catch (err) {
    if (err?.code === 11000 && err.keyPattern?.phone) {
      // Phone trùng guest khác — đổi đuôi
      const altPhone = `0900${String(Date.now()).slice(-6)}`;
      return User.create({
        name: profile.name,
        email: profile.email,
        phone: altPhone,
        password,
        role: "guest",
        status: "active",
        idNumber: "001099001001",
      });
    }
    throw err;
  }
}

async function clearPreviousSeed(guestIds) {
  await Booking.deleteMany({ guest: { $in: guestIds } });
  await CancelAbuseFlag.deleteMany({ guest: { $in: guestIds } });
}

function buildCancelledBooking({ guest, hotel, room, index, cancelDaysAgo }) {
  const nights = 2;
  const checkInDate = addDays(new Date(), 10 + index * 3);
  checkInDate.setHours(12, 0, 0, 0);
  const checkOutDate = addDays(checkInDate, nights);
  const basePrice = roundToTenThousand((room.price || 500000) * nights);
  const cancelAt = addDays(new Date(), -cancelDaysAgo);
  cancelAt.setHours(10 + index, 15, 0, 0);

  return {
    guest: guest._id,
    hotel: hotel._id,
    room: room._id,
    checkInDate,
    checkOutDate,
    guestCount: 1,
    guestIdNumber: "001099001001",
    selectedAddons: [],
    addonsAmount: 0,
    basePrice,
    discountAmount: 0,
    finalAmount: basePrice,
    paymentStatus: "cancelled",
    paymentMethod: index % 2 === 0 ? "qr_code" : "vnpay",
    cancellationReason: `Seed blacklist — hủy lần ${index + 1}`,
    guestCancelRequestedAt: cancelAt,
    guestCancelSnapshot: {
      wasPaid: index % 2 === 1,
      paymentMethod: index % 2 === 0 ? "qr_code" : "vnpay",
      refundPolicyEligible: index % 2 === 1,
    },
    createdAt: addDays(cancelAt, -1),
    updatedAt: cancelAt,
  };
}

async function seedCancelledBookings({ guest, hotel, rooms, cancelCount }) {
  const docs = [];
  for (let i = 0; i < cancelCount; i += 1) {
    const room = rooms[i % rooms.length];
    // Phân bố trong cửa sổ WINDOW_DAYS (0 .. WINDOW_DAYS-1)
    const cancelDaysAgo = Math.min(WINDOW_DAYS - 1, Math.floor((i * (WINDOW_DAYS - 1)) / Math.max(cancelCount - 1, 1)));
    docs.push(
      buildCancelledBooking({
        guest,
        hotel,
        room,
        index: i,
        cancelDaysAgo,
      })
    );
  }
  return Booking.insertMany(docs);
}

async function main() {
  if (!process.env.MONGO_URL) {
    console.error("Thiếu MONGO_URL trong file .env");
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGO_URL, { dbName: "StayJourney" });
  console.log("Đã kết nối MongoDB (StayJourney)\nSeed danh sách đen...\n");

  const { hotel, rooms } = await findHotelWithRooms();
  console.log(`Khách sạn: ${hotel.name} (${rooms.length} phòng)`);
  console.log(`Ngưỡng: ≥ ${THRESHOLD} hủy / ${WINDOW_DAYS} ngày\n`);

  const abuseGuest = await upsertGuest(TEST_GUESTS.abuse);
  const underGuest = await upsertGuest(TEST_GUESTS.under);
  const sanctionedGuest = await upsertGuest(TEST_GUESTS.sanctioned);

  await clearPreviousSeed([abuseGuest._id, underGuest._id, sanctionedGuest._id]);

  const abuseBookings = await seedCancelledBookings({
    guest: abuseGuest,
    hotel,
    rooms,
    cancelCount: TEST_GUESTS.abuse.cancelCount,
  });
  const underBookings = await seedCancelledBookings({
    guest: underGuest,
    hotel,
    rooms,
    cancelCount: TEST_GUESTS.under.cancelCount,
  });
  const sanctionedBookings = await seedCancelledBookings({
    guest: sanctionedGuest,
    hotel,
    rooms,
    cancelCount: TEST_GUESTS.sanctioned.cancelCount,
  });

  console.log(`✓ ${TEST_GUESTS.abuse.email}: ${abuseBookings.length} đơn hủy`);
  console.log(`✓ ${TEST_GUESTS.under.email}: ${underBookings.length} đơn hủy (dưới ngưỡng)`);
  console.log(`✓ ${TEST_GUESTS.sanctioned.email}: ${sanctionedBookings.length} đơn hủy`);

  const lastAbuse = abuseBookings[abuseBookings.length - 1];
  const flag = await evaluateAfterGuestCancel(abuseGuest._id, lastAbuse._id);
  if (flag) {
    console.log(`✓ Đã tạo/cập nhật CancelAbuseFlag pending: ${flag._id}`);
  } else {
    console.warn("! Không tạo được cờ pending — kiểm tra THRESHOLD / guestCancelRequestedAt");
  }

  const underFlag = await evaluateAfterGuestCancel(
    underGuest._id,
    underBookings[underBookings.length - 1]._id
  );
  if (underFlag) {
    console.warn("! Guest dưới ngưỡng vẫn có cờ — không mong đợi");
  } else {
    console.log("✓ Guest dưới ngưỡng: không có cờ (đúng)");
  }

  const lastSanctioned = sanctionedBookings[sanctionedBookings.length - 1];
  let sanctionedFlagDoc = await evaluateAfterGuestCancel(
    sanctionedGuest._id,
    lastSanctioned._id
  );
  if (!sanctionedFlagDoc) {
    sanctionedFlagDoc = await CancelAbuseFlag.findOne({
      guest: sanctionedGuest._id,
      status: "pending",
    });
  }

  if (sanctionedFlagDoc) {
    const until = addDays(new Date(), 7);
    sanctionedGuest.status = "inactive";
    sanctionedGuest.inactiveUntil = until;
    sanctionedGuest.inactiveReason = "Seed: đã cấm 7 ngày để test tab Đã cấm";
    sanctionedGuest.refreshTokenHash = null;
    sanctionedGuest.refreshTokenExpires = null;
    await sanctionedGuest.save();

    sanctionedFlagDoc.status = "sanctioned";
    sanctionedFlagDoc.reviewedAt = new Date();
    sanctionedFlagDoc.adminNote = "Seed — đã vô hiệu hóa 7 ngày";
    sanctionedFlagDoc.sanctionDays = 7;
    sanctionedFlagDoc.sanctionUntil = until;
    await sanctionedFlagDoc.save();
    console.log(`✓ Guest sanctioned: inactive đến ${until.toLocaleString("vi-VN")}`);
  }

  // Cho notify realtime (fire-and-forget) kịp chạy trước khi đóng Mongo
  await new Promise((r) => setTimeout(r, 800));

  console.log("\n=== Seed danh sách đen hoàn tất ===");
  console.log(`Password chung: ${COMMON_PASSWORD}\n`);
  console.log("Cách test:");
  console.log("  1. Đăng nhập admin → menu Danh sách đen");
  console.log(`  2. Tab Chờ xử lý: ${TEST_GUESTS.abuse.email} (${TEST_GUESTS.abuse.cancelCount} hủy)`);
  console.log(`  3. Tab Đã cấm: ${TEST_GUESTS.sanctioned.email}`);
  console.log(
    `  4. ${TEST_GUESTS.under.email} có ${TEST_GUESTS.under.cancelCount} hủy — không hiện trong list`
  );
  console.log(
    `  5. Thử login ${TEST_GUESTS.sanctioned.email} → phải bị chặn (tài khoản vô hiệu hóa)`
  );

  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error("Lỗi seed danh sách đen:", err);
  try {
    await mongoose.disconnect();
  } catch {
    /* ignore */
  }
  process.exit(1);
});
