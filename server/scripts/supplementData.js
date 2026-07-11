/**
 * Bổ sung dữ liệu incremental (không xóa data cũ):
 * - ~10 đơn tương lai cho khách sạn "Silver Resort Nha Trang"
 * - Trang thiết bị (roomEquipment) cho tất cả khách sạn
 * - Notification backfill từ bookings/reviews hiện có
 *
 * Chạy: node scripts/supplementData.js
 *   hoặc: npm run db:supplement
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const PaymentTransaction = require("../models/PaymentTransaction");
const Review = require("../models/Review");
const Notification = require("../models/Notification");
const { getBookingFinalAmount } = require("../services/bookings/bookingAmount");
const { getHotelStatusLabel } = require("../services/hotels/status");
const { supplementEquipmentForHotels } = require("./roomEquipmentSeed");

const {
  addDays,
  randomInt,
  pickOne,
  generateTransactionRef,
  datesOverlap,
} = require("./helpers");

const TARGET_HOTEL_NAME = "Silver Resort Nha Trang";
const FUTURE_BOOKING_COUNT = 10;
const HIGH_VALUE_THRESHOLD = 10_000_000;

function roundToTenThousand(amount) {
  const n = Number(amount) || 0;
  if (n <= 0) return 0;
  return Math.max(10000, Math.round(n / 10000) * 10000);
}

function bookingIdShort(id) {
  return String(id).slice(-6).toUpperCase();
}

function formatVnDate(date) {
  return new Date(date).toLocaleDateString("vi-VN");
}

function formatAmount(amount) {
  return Number(amount).toLocaleString("vi-VN");
}

async function findTargetHotel() {
  const hotel = await Hotel.findOne({ name: TARGET_HOTEL_NAME });
  if (hotel) return hotel;

  const fuzzy = await Hotel.findOne({ name: { $regex: /Silver Resort.*Nha Trang/i } });
  if (fuzzy) return fuzzy;

  throw new Error(`Không tìm thấy khách sạn "${TARGET_HOTEL_NAME}" trong DB.`);
}

async function loadRoomOccupancy(hotelId, roomIds) {
  const bookings = await Booking.find({
    hotel: hotelId,
    room: { $in: roomIds },
    paymentStatus: { $in: ["paid", "pending"] },
  }).select("room checkInDate checkOutDate");

  const map = new Map();
  for (const b of bookings) {
    const key = String(b.room);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push({ checkInDate: b.checkInDate, checkOutDate: b.checkOutDate });
  }
  return map;
}

async function addFutureBookings(hotel) {
  const existingCount = await Booking.countDocuments({ hotel: hotel._id });
  if (existingCount >= 50) {
    console.log(
      `  - "${hotel.name}" đã có ${existingCount} đơn (≥50) — bỏ qua tạo đơn tương lai.`
    );
    return { bookings: [], transactions: [], notifications: [] };
  }

  const toCreate = Math.min(FUTURE_BOOKING_COUNT, 50 - existingCount);
  const guests = await User.find({ role: "guest", status: "active" });
  if (guests.length === 0) throw new Error("Không có guest nào trong DB.");

  const rooms = await Room.find({ hotelId: hotel._id, roomStatus: "active" });
  if (rooms.length === 0) throw new Error(`Khách sạn "${hotel.name}" chưa có phòng.`);

  const occupancy = await loadRoomOccupancy(
    hotel._id,
    rooms.map((r) => r._id)
  );

  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const bookingPayloads = [];

  for (let i = 0; i < toCreate; i += 1) {
    let scheduled = false;

    for (let attempt = 0; attempt < 40; attempt += 1) {
      const room = pickOne(rooms);
      const nights = randomInt(1, 4);
      const checkIn = addDays(today, randomInt(3, 90));
      checkIn.setHours(14, 0, 0, 0);
      const checkOut = addDays(checkIn, nights);
      checkOut.setHours(12, 0, 0, 0);

      const key = String(room._id);
      const existing = occupancy.get(key) || [];
      const conflict = existing.some((b) =>
        datesOverlap(checkIn, checkOut, b.checkInDate, b.checkOutDate)
      );
      if (conflict) continue;

      const guestCount = randomInt(1, Math.min(room.maxPeople || 2, 4));
      const basePrice = roundToTenThousand(room.price * nights);
      const discountAmount = i % 4 === 0 ? roundToTenThousand(basePrice * 0.1) : 0;
      // KS tập trung: không tạo đơn chờ duyệt
      const paymentStatus = Math.random() < 0.75 ? "paid" : "cancelled";
      const paymentMethod = Math.random() < 0.6 ? "qr_code" : "vnpay";
      const createdAt = addDays(today, -randomInt(0, 14));
      createdAt.setHours(randomInt(8, 20), randomInt(0, 59), randomInt(0, 59), 0);

      const payload = {
        guest: pickOne(guests)._id,
        hotel: hotel._id,
        room: room._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestCount,
        selectedAddons: [],
        addonsAmount: 0,
        basePrice,
        discountAmount,
        finalAmount: roundToTenThousand(basePrice - discountAmount),
        promotionApplied: discountAmount > 0 ? { title: "Ưu đãi đặt sớm" } : undefined,
        paymentStatus,
        paymentMethod,
        specialRequests:
          i % 3 === 0
            ? pickOne([
                "Phòng view biển nếu còn",
                "Check-in sớm 12h",
                "Giường phụ cho trẻ em",
              ])
            : undefined,
        createdAt,
        updatedAt: createdAt,
      };

      if (paymentStatus === "paid" && paymentMethod === "vnpay") {
        payload.vnpayPaidAt = addDays(createdAt, 0);
        payload.vnpayPaidAt.setMinutes(payload.vnpayPaidAt.getMinutes() + randomInt(5, 40));
        payload.vnpayOwnerVerifiedAt = addDays(payload.vnpayPaidAt, 0);
        payload.vnpayOwnerVerifiedAt.setHours(
          payload.vnpayOwnerVerifiedAt.getHours() + randomInt(1, 8)
        );
      }

      bookingPayloads.push(payload);

      existing.push({ checkInDate: checkIn, checkOutDate: checkOut });
      occupancy.set(key, existing);
      scheduled = true;
      break;
    }

    if (!scheduled) {
      console.warn(`  ! Không tìm được slot trống cho đơn tương lai #${i + 1}, bỏ qua.`);
    }
  }

  if (bookingPayloads.length === 0) {
    console.log("  - Không tạo được đơn tương lai mới (phòng đã kín).");
    return { bookings: [], transactions: [], notifications: [] };
  }

  const bookings = await Booking.insertMany(bookingPayloads);

  const txBaseIndex = Date.now();
  const transactions = bookings.map((booking, index) => {
    const txStatus =
      booking.paymentStatus === "paid"
        ? "success"
        : booking.paymentStatus === "cancelled"
          ? "cancelled"
          : "pending";
    const txCreatedAt = booking.createdAt
      ? new Date(booking.createdAt)
      : addDays(new Date(), -randomInt(0, 2));

    return {
      booking: booking._id,
      transactionRef: generateTransactionRef(booking._id, txBaseIndex + index),
      amount: booking.finalAmount,
      paymentMethod: booking.paymentMethod,
      status: txStatus,
      clientIp: `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      createdAt: txCreatedAt,
      updatedAt: txCreatedAt,
    };
  });

  await PaymentTransaction.insertMany(transactions);

  const notifications = [];
  for (const booking of bookings) {
    if (booking.paymentStatus !== "paid") continue;

    const guest = guests.find((g) => String(g._id) === String(booking.guest));
    const amount = formatAmount(booking.finalAmount);
    const checkInDate = formatVnDate(booking.checkInDate);
    const paymentMethod =
      booking.paymentMethod === "vnpay" ? "cổng thanh toán VNPay" : "QR code";
    const createdAt = booking.createdAt
      ? new Date(booking.createdAt)
      : addDays(new Date(), -randomInt(0, 1));

    notifications.push({
      recipientRole: "hotel",
      hotel: hotel._id,
      type: "new_booking",
      title: "Đặt phòng mới",
      message: `Đơn đặt phòng mới #BK${bookingIdShort(booking._id)} từ ${guest?.name || "Khách"}. Check-in: ${checkInDate}. Đã thanh toán ${amount} VNĐ qua ${paymentMethod}.`,
      relatedId: booking._id,
      relatedModel: "Booking",
      readBy: Math.random() < 0.3 ? [hotel.ownerId] : [],
      createdAt,
    });

    notifications.push({
      recipient: booking.guest,
      recipientRole: "guest",
      type: "booking_confirmed",
      title: "Đặt phòng thành công",
      message: `Chúc mừng! Bạn đã đặt thành công phòng tại khách sạn ${hotel.name}. Mã đặt phòng: #BK${bookingIdShort(booking._id)}. Check-in: ${checkInDate}.`,
      relatedId: booking._id,
      relatedModel: "Booking",
      readBy: Math.random() < 0.4 ? [booking.guest] : [],
      createdAt,
    });
  }

  if (notifications.length > 0) {
    await Notification.insertMany(notifications);
  }

  console.log(`  ✓ Đơn tương lai "${hotel.name}": ${bookings.length}`);
  console.log(`  ✓ PaymentTransactions mới: ${transactions.length}`);
  console.log(`  ✓ Notification cho đơn mới: ${notifications.length}`);

  return { bookings, transactions, notifications };
}

async function supplementAllHotelsEquipment({ force = false } = {}) {
  const hotels = await Hotel.find().select("_id name").lean();
  if (hotels.length === 0) {
    console.log("  - Không có khách sạn để bổ sung thiết bị.");
    return null;
  }

  const result = await supplementEquipmentForHotels(hotels, { force });
  console.log(`  ✓ Thiết bị phòng: ${result.updated} phòng cập nhật / ${result.roomCount} phòng (${hotels.length} KS)`);
  console.log(`  - Bỏ qua (đã có): ${result.skipped}`);
  console.log(
    `  ✓ Tổng item: ${result.totalItems} (OK ${result.statusCount.operational || 0} | sửa ${result.statusCount.under_repair || 0} | hỏng ${result.statusCount.broken || 0})`
  );
  return result;
}

function pushUniqueNotification(bucket, keySet, doc) {
  const key = [
    doc.recipientRole,
    doc.recipient ? String(doc.recipient) : "",
    doc.hotel ? String(doc.hotel) : "",
    doc.type,
    doc.relatedId ? String(doc.relatedId) : "",
  ].join("|");

  if (keySet.has(key)) return;
  keySet.add(key);
  bucket.push(doc);
}

async function backfillNotifications() {
  const existing = await Notification.find().select(
    "recipient recipientRole hotel type relatedId"
  ).lean();

  const keySet = new Set(
    existing.map((n) =>
      [
        n.recipientRole,
        n.recipient ? String(n.recipient) : "",
        n.hotel ? String(n.hotel) : "",
        n.type,
        n.relatedId ? String(n.relatedId) : "",
      ].join("|")
    )
  );

  const admins = await User.find({ role: "admin", status: "active" }).select("_id").lean();
  const notifications = [];
  const now = new Date();

  const bookings = await Booking.find()
    .populate("guest", "name")
    .populate("hotel", "name ownerId")
    .populate("room", "roomNumber")
    .lean();

  for (const booking of bookings) {
    const hotelId = booking.hotel?._id;
    if (!hotelId) continue;

    const guestName = booking.guest?.name || "Khách";
    const hotelName = booking.hotel?.name || "N/A";
    const idShort = bookingIdShort(booking._id);
    const amount = getBookingFinalAmount(booking);
    const createdBase = booking.createdAt ? new Date(booking.createdAt) : addDays(now, -30);

    if (booking.paymentStatus === "paid") {
      const checkInDate = formatVnDate(booking.checkInDate);
      const paymentMethod =
        booking.paymentMethod === "vnpay" ? "cổng thanh toán VNPay" : "QR code";

      pushUniqueNotification(notifications, keySet, {
        recipientRole: "hotel",
        hotel: hotelId,
        type: "new_booking",
        title: "Đặt phòng mới",
        message: `Đơn đặt phòng mới #BK${idShort} từ ${guestName}. Check-in: ${checkInDate}. Đã thanh toán ${formatAmount(amount)} VNĐ qua ${paymentMethod}.`,
        relatedId: booking._id,
        relatedModel: "Booking",
        readBy: Math.random() < 0.45 ? [booking.hotel.ownerId] : [],
        createdAt: createdBase,
      });

      pushUniqueNotification(notifications, keySet, {
        recipient: booking.guest?._id || booking.guest,
        recipientRole: "guest",
        type: "booking_confirmed",
        title: "Đặt phòng thành công",
        message: `Chúc mừng! Bạn đã đặt thành công phòng tại khách sạn ${hotelName}. Mã đặt phòng: #BK${idShort}. Check-in: ${checkInDate}.`,
        relatedId: booking._id,
        relatedModel: "Booking",
        readBy: Math.random() < 0.5 ? [booking.guest?._id || booking.guest] : [],
        createdAt: createdBase,
      });

      if (amount >= HIGH_VALUE_THRESHOLD) {
        for (const admin of admins) {
          pushUniqueNotification(notifications, keySet, {
            recipient: admin._id,
            recipientRole: "admin",
            type: "high_value_booking",
            title: "Đặt phòng giá trị cao",
            message: `Đơn đặt phòng #BK${idShort} có giá trị ${formatAmount(amount)} VNĐ từ khách ${guestName} tại khách sạn ${hotelName}.`,
            relatedId: booking._id,
            relatedModel: "Booking",
            readBy: Math.random() < 0.6 ? [admin._id] : [],
            createdAt: createdBase,
          });
        }
      }
    }

    if (booking.paymentStatus === "cancelled") {
      const cancelAt = booking.guestCancelRequestedAt
        ? new Date(booking.guestCancelRequestedAt)
        : addDays(createdBase, 1);
      const reason = booking.cancellationReason
        ? ` Lý do: ${booking.cancellationReason}.`
        : "";

      pushUniqueNotification(notifications, keySet, {
        recipientRole: "hotel",
        hotel: hotelId,
        type: "booking_cancelled",
        title: "Khách hủy phòng",
        message: `Đơn #BK${idShort} đã bị hủy bởi ${guestName}.${reason}`,
        relatedId: booking._id,
        relatedModel: "Booking",
        readBy: Math.random() < 0.4 ? [booking.hotel.ownerId] : [],
        createdAt: cancelAt,
      });

      pushUniqueNotification(notifications, keySet, {
        recipient: booking.guest?._id || booking.guest,
        recipientRole: "guest",
        type: "booking_cancelled",
        title: "Đơn đặt phòng đã được hủy",
        message: `Đơn đặt phòng #BK${idShort} của bạn đã được hủy thành công.`,
        relatedId: booking._id,
        relatedModel: "Booking",
        readBy: Math.random() < 0.55 ? [booking.guest?._id || booking.guest] : [],
        createdAt: cancelAt,
      });
    }

    if (booking.checkedInAt) {
      pushUniqueNotification(notifications, keySet, {
        recipientRole: "hotel",
        hotel: hotelId,
        type: "checkin_today",
        title: "Khách đã check-in",
        message: `Phòng ${booking.room?.roomNumber || "N/A"} — ${guestName} đã check-in`,
        relatedId: booking._id,
        relatedModel: "Booking",
        readBy: Math.random() < 0.5 ? [booking.hotel.ownerId] : [],
        createdAt: new Date(booking.checkedInAt),
      });
    }

    if (booking.checkedOutAt) {
      pushUniqueNotification(notifications, keySet, {
        recipientRole: "hotel",
        hotel: hotelId,
        type: "checkout_today",
        title: "Khách đã check-out",
        message: `Phòng ${booking.room?.roomNumber || "N/A"} — ${guestName} đã check-out`,
        relatedId: booking._id,
        relatedModel: "Booking",
        readBy: Math.random() < 0.5 ? [booking.hotel.ownerId] : [],
        createdAt: new Date(booking.checkedOutAt),
      });
    }

    if (booking.ownerRefundCompletedAt) {
      pushUniqueNotification(notifications, keySet, {
        recipient: booking.guest?._id || booking.guest,
        recipientRole: "guest",
        type: "refund_processed",
        title: "Hoàn tiền thành công",
        message: `Khách sạn đã xác nhận hoàn tiền cho đơn #BK${idShort}. Số tiền ${formatAmount(amount)} VNĐ — vui lòng đối chiếu tài khoản.`,
        relatedId: booking._id,
        relatedModel: "Booking",
        readBy: Math.random() < 0.7 ? [booking.guest?._id || booking.guest] : [],
        createdAt: new Date(booking.ownerRefundCompletedAt),
      });
    }

    if (booking.ownerQrRejectionType === "invalid_proof") {
      pushUniqueNotification(notifications, keySet, {
        recipient: booking.guest?._id || booking.guest,
        recipientRole: "guest",
        type: "qr_proof_resubmit",
        title: "Cần tải lại minh chứng thanh toán",
        message: `Khách sạn ${hotelName} yêu cầu bạn tải lại minh chứng chuyển khoản cho đơn #BK${idShort}. Lý do: Minh chứng không hợp lệ.`,
        relatedId: booking._id,
        relatedModel: "Booking",
        readBy: [],
        createdAt: addDays(createdBase, 1),
      });
    }

    if (booking.ownerQrRejectionType === "payment_not_successful") {
      pushUniqueNotification(notifications, keySet, {
        recipient: booking.guest?._id || booking.guest,
        recipientRole: "guest",
        type: "payment_rejected",
        title: "Đơn đặt phòng đã bị hủy",
        message: `Khách sạn ${hotelName} đã hủy đơn #BK${idShort}. Lý do: Thanh toán chưa thành công.`,
        relatedId: booking._id,
        relatedModel: "Booking",
        readBy: [],
        createdAt: addDays(createdBase, 1),
      });
    }
  }

  const reviews = await Review.find()
    .populate("guest", "name")
    .populate("hotel", "name ownerId")
    .lean();

  for (const review of reviews) {
    const hotelId = review.hotel?._id;
    if (!hotelId) continue;

    const guestName = review.guest?.name || "Khách";
    const createdAt = review.createdAt ? new Date(review.createdAt) : addDays(now, -10);
    const isNegative = review.rating <= 2;

    pushUniqueNotification(notifications, keySet, {
      recipientRole: "hotel",
      hotel: hotelId,
      type: isNegative ? "negative_review" : "new_review",
      title: isNegative ? "Cảnh báo: Đánh giá tiêu cực" : "Đánh giá mới",
      message: isNegative
        ? `Đánh giá ${review.rating} sao từ ${guestName}.`
        : `${guestName} vừa đánh giá ${review.rating} sao.`,
      relatedId: review._id,
      relatedModel: "Review",
      readBy: Math.random() < 0.35 ? [review.hotel.ownerId] : [],
      createdAt,
    });
  }

  const maintenanceHotels = await Hotel.find({ status: { $in: ["maintenance", "inactive"] } })
    .select("name status updatedAt createdAt")
    .lean();

  for (const hotel of maintenanceHotels) {
    const newLabel = getHotelStatusLabel(hotel.status);
    const title =
      hotel.status === "maintenance"
        ? "Khách sạn đang bảo trì"
        : "Khách sạn dừng hoạt động";
    const message =
      hotel.status === "maintenance"
        ? `Quản trị viên đã chuyển trạng thái "${hotel.name}" sang ${newLabel}. Khách sạn tạm ẩn với khách trong thời gian bảo trì.`
        : `Quản trị viên đã chuyển trạng thái "${hotel.name}" sang ${newLabel}. Khách sạn không còn hiển thị với khách.`;

    pushUniqueNotification(notifications, keySet, {
      recipientRole: "hotel",
      hotel: hotel._id,
      type: "hotel_status_changed",
      title,
      message,
      relatedId: hotel._id,
      relatedModel: "Hotel",
      readBy: [],
      createdAt: hotel.updatedAt ? new Date(hotel.updatedAt) : new Date(hotel.createdAt),
    });
  }

  if (notifications.length === 0) {
    console.log("  - Không có notification mới cần bổ sung.");
    return 0;
  }

  await Notification.insertMany(notifications);
  console.log(`  ✓ Notification backfill: ${notifications.length} (tổng hiện có: ${existing.length + notifications.length})`);
  return notifications.length;
}

async function supplementData() {
  if (!process.env.MONGO_URL) {
    console.error("Thiếu MONGO_URL trong file .env");
    process.exit(1);
  }

  const forceEquipment = process.argv.includes("--force-equipment");

  try {
    await mongoose.connect(process.env.MONGO_URL, { dbName: "StayJourney" });
    console.log("Đã kết nối MongoDB (StayJourney)\n--- Bổ sung đơn tương lai ---");

    const hotel = await findTargetHotel();
    console.log(`  → Khách sạn: ${hotel.name} (${hotel._id})`);
    await addFutureBookings(hotel);

    console.log("\n--- Bổ sung thiết bị phòng (tất cả KS) ---");
    await supplementAllHotelsEquipment({ force: forceEquipment });

    console.log("\n--- Backfill Notification từ data hiện có ---");
    await backfillNotifications();

    console.log("\n=== Bổ sung dữ liệu hoàn tất ===");
  } catch (err) {
    console.error("Lỗi bổ sung dữ liệu:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = {
  supplementData,
  addFutureBookings,
  backfillNotifications,
  supplementAllHotelsEquipment,
};

if (require.main === module) {
  supplementData();
}
