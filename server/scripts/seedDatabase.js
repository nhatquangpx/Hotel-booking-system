/**
 * Seed dữ liệu mẫu cho StayJourney.
 * Chạy: node scripts/seedDatabase.js
 * Reset + seed: number: node scripts/reseedDatabase.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const User = require("../models/User");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const Booking = require("../models/Booking");
const PaymentTransaction = require("../models/PaymentTransaction");
const Review = require("../models/Review");
const SalePromotion = require("../models/SalePromotion");
const ContactMessage = require("../models/ContactMessage");

const {
  ROOM_TYPES,
  ROOM_TYPE_META,
  FACILITIES,
  REVIEW_COMMENTS,
  vnDateKey,
  addDays,
  randomInt,
  pickOne,
  pickMany,
  shuffle,
  hashPassword,
  randomVnName,
  uniquePhone,
  uniqueEmail,
  randomHotelName,
  randomAddress,
  generateTransactionRef,
  datesOverlap,
  formatYmd,
  ymdToDate,
} = require("./helpers");

const COMMON_PASSWORD = "123456";
const MIN_USERS = 50;
const MIN_HOTELS = 50;
const MIN_BOOKINGS = 200;
const FOCUS_BOOKINGS = 20;
const MIN_CONTACT_MESSAGES = 20;

const REAL_ACCOUNTS = {
  guest: { email: "quang.dn225911@sis.hust.edu.vn", name: "Đoàn Nhật Quang (Guest)" },
  admin: { email: "doannhatquang0@gmail.com", name: "Đoàn Nhật Quang (Admin)" },
  owner: { email: "nhtquangforwork@gmail.com", name: "Đoàn Nhật Quang (Owner)" },
  staff: { email: "demonlord29082004@gmail.com", name: "Đoàn Nhật Quang (Staff)" },
};

async function createUsers() {
  const hashed = await hashPassword(COMMON_PASSWORD);
  const users = [];
  let phoneIndex = 1;

  const pushUser = (data) => {
    users.push({
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashed,
      phone: data.phone || uniquePhone(phoneIndex++),
      role: data.role,
      status: "active",
    });
  };

  pushUser({ ...REAL_ACCOUNTS.admin, role: "admin" });
  pushUser({ ...REAL_ACCOUNTS.owner, role: "owner" });
  pushUser({ ...REAL_ACCOUNTS.staff, role: "staff" });
  pushUser({ ...REAL_ACCOUNTS.guest, role: "guest" });

  const ownerCount = 14;
  const staffCount = 14;
  const guestCount = MIN_USERS - 4 - ownerCount - staffCount;

  for (let i = 1; i <= ownerCount; i += 1) {
    pushUser({ name: randomVnName(), email: uniqueEmail("owner", i), role: "owner" });
  }
  for (let i = 1; i <= staffCount; i += 1) {
    pushUser({ name: randomVnName(), email: uniqueEmail("staff", i), role: "staff" });
  }
  for (let i = 1; i <= Math.max(guestCount, 18); i += 1) {
    pushUser({ name: randomVnName(), email: uniqueEmail("guest", i), role: "guest" });
  }

  const created = await User.insertMany(users);
  console.log(`  ✓ Users: ${created.length} (guest/admin/owner/staff)`);
  return created;
}

function buildRoomsForHotel(hotelId) {
  const floors = randomInt(4, 5);
  const totalRooms = floors === 5 ? randomInt(25, 28) : randomInt(20, 24);
  const basePerFloor = Math.floor(totalRooms / floors);
  const extra = totalRooms % floors;
  const rooms = [];

  for (let floor = 1; floor <= floors; floor += 1) {
    const countOnFloor = basePerFloor + (floor <= extra ? 1 : 0);
    for (let n = 1; n <= countOnFloor; n += 1) {
      const type = pickOne(ROOM_TYPES);
      const meta = ROOM_TYPE_META[type];
      const roomNumber = `${floor}${String(n).padStart(2, "0")}`;
      rooms.push({
        hotelId,
        roomNumber,
        type,
        description: `${meta.label} tầng ${floor}, diện tích ${randomInt(22, 45)}m², view ${pickOne(["thành phố", "biển", "núi", "vườn"])}.`,
        price: meta.price + randomInt(-50000, 100000),
        maxPeople: meta.maxPeople,
        facilities: pickMany(FACILITIES, randomInt(4, 7)),
        images: [
          `https://picsum.photos/seed/${hotelId}-${roomNumber}-1/800/600`,
          `https://picsum.photos/seed/${hotelId}-${roomNumber}-2/800/600`,
        ],
        roomStatus: Math.random() < 0.95 ? "active" : "maintenance",
        bookingStatus: "empty",
      });
    }
  }
  return rooms;
}

async function createHotelsAndRooms(users) {
  const owners = users.filter((u) => u.role === "owner");
  const otherOwners = owners.filter((o) => o.email !== REAL_ACCOUNTS.owner.email);
  const staffUsers = users.filter((u) => u.role === "staff");
  const mainOwner = owners.find((o) => o.email === REAL_ACCOUNTS.owner.email);

  const hotelDocs = [];
  const mainOwnerHotelCount = 3;

  for (let i = 0; i < MIN_HOTELS; i += 1) {
    let owner;
    if (i < mainOwnerHotelCount) {
      owner = mainOwner;
    } else {
      owner = otherOwners[(i - mainOwnerHotelCount) % otherOwners.length];
    }

    const addr = randomAddress();
    hotelDocs.push({
      name: randomHotelName(addr.city),
      ownerId: owner._id,
      description: `Khách sạn ${randomInt(3, 5)} sao tại ${addr.city}, phục vụ khách du lịch và công tác. Tiện nghi hiện đại, nhân viên chuyên nghiệp.`,
      address: addr,
      images: [
        `https://picsum.photos/seed/hotel-${i}-1/1200/800`,
        `https://picsum.photos/seed/hotel-${i}-2/1200/800`,
        `https://picsum.photos/seed/hotel-${i}-3/1200/800`,
      ],
      starRating: randomInt(3, 5),
      contactInfo: {
        phone: uniquePhone(50000 + i),
        email: `hotel${i + 1}@stayjourney-seed.test`,
      },
      policies: {
        checkInTime: "14:00",
        checkOutTime: "12:00",
        refundMinDaysBeforeCheckIn: 2,
      },
      status: Math.random() < 0.92 ? "active" : "maintenance",
      staffIds: [],
    });
  }

  const hotels = await Hotel.insertMany(
    hotelDocs.map(({ starRating, ...h }) => ({
      ...h,
      starRating: starRating || randomInt(3, 5),
    }))
  );

  const mainOwnerHotels = hotels.filter((h) => String(h.ownerId) === String(mainOwner._id));
  const focusHotel = mainOwnerHotels[0];

  const staffPool = shuffle(staffUsers);
  const mainStaff = staffPool.find((s) => s.email === REAL_ACCOUNTS.staff.email) || staffPool[0];
  const otherStaff = staffPool.filter((s) => String(s._id) !== String(mainStaff._id));

  await Hotel.findByIdAndUpdate(focusHotel._id, { $set: { staffIds: [mainStaff._id] } });
  focusHotel.staffIds = [mainStaff._id];

  let staffIdx = 0;
  for (const hotel of hotels) {
    if (String(hotel._id) === String(focusHotel._id)) continue;
    if (staffIdx >= otherStaff.length) break;
    if (Math.random() < 0.55) {
      const staff = otherStaff[staffIdx++];
      await Hotel.findByIdAndUpdate(hotel._id, { $set: { staffIds: [staff._id] } });
      hotel.staffIds = [staff._id];
    }
  }

  const allRooms = [];
  for (const hotel of hotels) {
    allRooms.push(...buildRoomsForHotel(hotel._id));
  }
  const rooms = await Room.insertMany(allRooms);

  console.log(`  ✓ Hotels: ${hotels.length} (owner chính: ${mainOwnerHotels.length} KS)`);
  console.log(`  ✓ Rooms: ${rooms.length} (tối thiểu 20/KS, 4-5 tầng)`);

  return { hotels, rooms, focusHotel, mainOwner, mainOwnerHotels };
}

function pickPaymentStatus(isPast) {
  const r = Math.random();
  if (isPast) {
    if (r < 0.78) return "paid";
    if (r < 0.88) return "cancelled";
    return "pending";
  }
  if (r < 0.55) return "paid";
  if (r < 0.85) return "pending";
  return "cancelled";
}

function transactionStatusForPayment(paymentStatus) {
  if (paymentStatus === "paid") return "success";
  if (paymentStatus === "cancelled") return "cancelled";
  return "pending";
}

async function createBookingsReviewsTransactions(users, hotels, rooms, focusHotel) {
  const guests = users.filter((u) => u.role === "guest");
  const today = new Date();
  today.setHours(12, 0, 0, 0);

  const roomsByHotel = new Map();
  for (const room of rooms) {
    const key = String(room.hotelId);
    if (!roomsByHotel.has(key)) roomsByHotel.set(key, []);
    roomsByHotel.get(key).push(room);
  }

  const roomBookings = new Map();
  const bookingPayloads = [];

  const scheduleBooking = (hotel, guest, forcePast = null) => {
    const hotelRooms = roomsByHotel.get(String(hotel._id)) || [];
    if (hotelRooms.length === 0) return false;

    for (let attempt = 0; attempt < 30; attempt += 1) {
      const room = pickOne(hotelRooms);
      const nights = randomInt(1, 5);
      let checkIn;

      if (forcePast === true) {
        checkIn = addDays(today, -randomInt(10, 180));
      } else if (forcePast === false) {
        checkIn = addDays(today, randomInt(1, 60));
      } else {
        checkIn = addDays(today, randomInt(-150, 45));
      }

      checkIn.setHours(14, 0, 0, 0);
      const checkOut = addDays(checkIn, nights);
      checkOut.setHours(12, 0, 0, 0);

      const key = String(room._id);
      const existing = roomBookings.get(key) || [];
      const conflict = existing.some((b) =>
        datesOverlap(checkIn, checkOut, b.checkInDate, b.checkOutDate)
      );
      if (conflict) continue;

      const basePrice = room.price * nights;
      const discountAmount = Math.random() < 0.2 ? Math.round(basePrice * 0.1) : 0;
      const finalAmount = basePrice - discountAmount;
      const isPast = checkOut < today;
      const paymentStatus = pickPaymentStatus(isPast);
      const paymentMethod = Math.random() < 0.65 ? "qr_code" : "vnpay";

      const payload = {
        guest: guest._id,
        hotel: hotel._id,
        room: room._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        basePrice,
        discountAmount,
        finalAmount,
        promotionApplied: discountAmount > 0 ? { title: "Ưu đãi mùa thấp điểm" } : undefined,
        paymentStatus,
        paymentMethod,
        specialRequests: Math.random() < 0.25 ? pickOne([
          "Phòng tầng cao, view đẹp",
          "Check-in sớm nếu có thể",
          "Cần thêm gối",
          "Phòng không hút thuốc",
        ]) : undefined,
      };

      if (paymentStatus === "paid" && isPast) {
        payload.checkedInAt = addDays(checkIn, 0);
        payload.checkedInAt.setHours(15, 0, 0, 0);
        payload.checkedOutAt = addDays(checkOut, 0);
        payload.checkedOutAt.setHours(11, 0, 0, 0);
      }

      if (paymentStatus === "cancelled" && Math.random() < 0.5) {
        payload.cancellationReason = pickOne([
          "Thay đổi lịch trình",
          "Tìm được khách sạn khác",
          "Công việc đột xuất",
        ]);
        payload.guestCancelRequestedAt = addDays(checkIn, -randomInt(1, 5));
      }

      existing.push({ checkInDate: checkIn, checkOutDate: checkOut });
      roomBookings.set(key, existing);
      bookingPayloads.push(payload);
      return true;
    }
    return false;
  };

  for (let i = 0; i < FOCUS_BOOKINGS; i += 1) {
    scheduleBooking(focusHotel, pickOne(guests), true);
  }

  while (bookingPayloads.length < MIN_BOOKINGS) {
    const hotel = pickOne(hotels);
    const guest = pickOne(guests);
    if (!scheduleBooking(hotel, guest)) {
      scheduleBooking(pickOne(hotels.filter((h) => roomsByHotel.get(String(h._id))?.length)), pickOne(guests));
    }
  }

  const bookings = await Booking.insertMany(bookingPayloads);

  const transactions = [];
  const reviews = [];

  bookings.forEach((booking, index) => {
    const txStatus = transactionStatusForPayment(booking.paymentStatus);
    transactions.push({
      booking: booking._id,
      transactionRef: generateTransactionRef(booking._id, index),
      amount: booking.finalAmount,
      paymentMethod: booking.paymentMethod,
      status: txStatus,
      clientIp: `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      ...(txStatus === "success" && booking.paymentMethod === "vnpay"
        ? {
            vnpResponseCode: "00",
            vnpTransactionStatus: "00",
            vnpBankCode: "NCB",
            vnpCardType: "ATM",
            vnpTxnRef: generateTransactionRef(booking._id, index + 1000),
          }
        : {}),
      ...(booking.paymentMethod === "qr_code" && txStatus === "success"
        ? { proofImageUrl: `https://picsum.photos/seed/proof-${index}/600/800` }
        : {}),
    });

    reviews.push({
      guest: booking.guest,
      hotel: booking.hotel,
      booking: booking._id,
      rating: randomInt(3, 5),
      comment: pickOne(REVIEW_COMMENTS),
      ...(Math.random() < 0.15
        ? {
            ownerResponse: "Cảm ơn quý khách đã lưu trú. Rất mong được đón tiếp lại!",
            ownerResponseAt: addDays(booking.checkOutDate, randomInt(1, 3)),
            replyRole: "owner",
          }
        : {}),
    });
  });

  await PaymentTransaction.insertMany(transactions);
  await Review.insertMany(reviews);

  const focusCount = bookings.filter((b) => String(b.hotel) === String(focusHotel._id)).length;
  console.log(`  ✓ Bookings: ${bookings.length} (${focusCount} tại KS owner chính)`);
  console.log(`  ✓ PaymentTransactions: ${transactions.length}`);
  console.log(`  ✓ Reviews: ${reviews.length}`);
}

async function createSalePromotions(mainOwnerHotels) {
  const todayYmd = vnDateKey();
  const today = ymdToDate(todayYmd);
  const promotions = [];

  const saleTemplates = [
    { title: "Flash Sale cuối tuần", scope: "hotel", discount: 15 },
    { title: "Giảm giá phòng Deluxe", scope: "room_type", roomType: "deluxe", discount: 20 },
    { title: "Combo Suite cao cấp", scope: "room_type", roomType: "suite", discount: 25 },
    { title: "Ưu đãi gia đình", scope: "room_type", roomType: "family", discount: 18 },
    { title: "Early Bird tháng này", scope: "hotel", discount: 12 },
    { title: "Sale mùa hè", scope: "hotel", discount: 22 },
    { title: "Executive Business Deal", scope: "room_type", roomType: "executive", discount: 30 },
    { title: "Standard Room Special", scope: "room_type", roomType: "standard", discount: 10 },
    { title: "StayJourney Member Day", scope: "hotel", discount: 17 },
    { title: "Grand Opening Promo", scope: "hotel", discount: 28 },
  ];

  const targetHotels = mainOwnerHotels.slice(0, 2);
  let pastCount = 0;
  let activeCount = 0;

  saleTemplates.forEach((tpl, i) => {
    const hotel = targetHotels[i % targetHotels.length];
    const isPast = i < 6;
    let startDate;
    let endDate;

    if (isPast) {
      pastCount += 1;
      endDate = addDays(today, -randomInt(5, 60));
      startDate = addDays(endDate, -randomInt(7, 30));
    } else {
      activeCount += 1;
      startDate = addDays(today, -randomInt(0, 10));
      endDate = addDays(today, randomInt(15, 45));
    }

    promotions.push({
      hotelId: hotel._id,
      title: tpl.title,
      scope: tpl.scope,
      roomType: tpl.scope === "room_type" ? tpl.roomType : undefined,
      startDate: formatYmd(startDate),
      endDate: formatYmd(endDate),
      discountPercent: tpl.discount,
      isActive: !isPast,
    });
  });

  await SalePromotion.insertMany(promotions);
  console.log(`  ✓ SalePromotions: ${promotions.length} (${pastCount} đã qua, ${activeCount} đang chạy)`);
}

async function createContactMessages(adminUser) {
  const subjects = [
    { subject: "Không đăng nhập được tài khoản", message: "Tôi nhập đúng email và mật khẩu nhưng hệ thống báo lỗi. Mong được hỗ trợ reset mật khẩu." },
    { subject: "Hỏi về chính sách hoàn tiền", message: "Tôi đã hủy đơn trước 3 ngày so với ngày check-in, xin hỏi thời gian hoàn tiền mất bao lâu?" },
    { subject: "Đề xuất hợp tác khách sạn", message: "Chúng tôi là chuỗi khách sạn boutique tại miền Trung, muốn đăng ký làm đối tác trên StayJourney." },
    { subject: "Báo lỗi thanh toán VNPay", message: "Khi thanh toán đơn #ABC123, cổng VNPay báo thành công nhưng đơn vẫn pending trên app." },
    { subject: "Khiếu nại dịch vụ phòng", message: "Phòng có mùi ẩm mốc và điều hòa kêu to. Nhân viên chưa xử lý kịp trong đêm qua." },
    { subject: "Yêu cầu xuất hóa đơn VAT", message: "Tôi cần hóa đơn đỏ cho đơn đặt phòng tuần trước, thông tin công ty đính kèm trong email này." },
    { subject: "Hỏi về chương trình khuyến mãi", message: "Sale 'Flash Sale cuối tuần' có áp dụng cho đặt phòng tháng sau không?" },
    { subject: "Góp ý giao diện website", message: "Trang chi tiết khách sạn trên mobile bị tràn chữ ở phần mô tả tiện ích." },
    { subject: "Mất đồ tại khách sạn", message: "Tôi để quên sạc laptop tại phòng 302, xin liên hệ giúp nếu còn." },
    { subject: "Đặt phòng nhóm 15 người", message: "Công ty chúng tôi cần 8 phòng cùng ngày check-in, có hỗ trợ giá đoàn không?" },
    { subject: "Thắc mắc xác minh QR", message: "Tôi chuyển khoản QR nhưng owner chưa xác nhận sau 24 giờ." },
    { subject: "Yêu cầu xóa tài khoản", message: "Theo quy định bảo mật, tôi muốn xóa tài khoản và dữ liệu cá nhân khỏi hệ thống." },
    { subject: "Báo cáo review không phù hợp", message: "Có review spam trên trang khách sạn của tôi, nội dung quảng cáo dịch vụ khác." },
    { subject: "Hỏi về bảo mật 2FA", message: "Làm sao bật xác thực hai lớp và lấy lại mã dự phòng nếu mất điện thoại?" },
    { subject: "Lỗi hiển thị ảnh phòng", message: "Ảnh phòng suite không load được trên trình duyệt Safari iOS." },
    { subject: "Phản hồi nhân viên hỗ trợ", message: "Cảm ơn team support đã phản hồi nhanh qua email hôm qua, tôi muốn gửi lời khen." },
    { subject: "Thay đổi thông tin booking", message: "Tôi nhập sai ngày check-out, có thể sửa từ 12/07 thành 14/07 không?" },
    { subject: "Tài khoản owner bị khóa", message: "Không truy cập được dashboard owner sau khi cập nhật thông tin ngân hàng." },
    { subject: "Hỏi commission platform", message: "Xin tư vấn mức phí và quy trình onboard khách sạn mới tại Cần Thơ." },
    { subject: "Bug báo cáo doanh thu", message: "Biểu đồ doanh thu tháng này hiển thị sai so với số booking đã thanh toán." },
  ];

  const messages = subjects.slice(0, MIN_CONTACT_MESSAGES).map((item, i) => ({
    name: randomVnName(),
    email: i % 3 === 0 ? REAL_ACCOUNTS.guest.email : `contact${i + 1}@example.com`,
    phone: uniquePhone(80000 + i),
    subject: item.subject,
    message: item.message,
    isRead: i % 4 === 0,
    readAt: i % 4 === 0 ? addDays(new Date(), -randomInt(1, 10)) : null,
    ...(i % 5 === 0
      ? {
          replyMessage: "Cảm ơn bạn đã liên hệ StayJourney. Chúng tôi đã ghi nhận và sẽ phản hồi chi tiết qua email.",
          repliedAt: new Date(),
          repliedBy: adminUser._id,
        }
      : {}),
  }));

  await ContactMessage.insertMany(messages);
  console.log(`  ✓ ContactMessages: ${messages.length}`);
}

async function seedDatabase() {
  if (!process.env.MONGO_URL) {
    console.error("Thiếu MONGO_URL trong file .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URL, { dbName: "StayJourney" });
    console.log("Đã kết nối MongoDB (StayJourney)\nBắt đầu seed...\n");

    const users = await createUsers();
    const { hotels, rooms, focusHotel, mainOwnerHotels } = await createHotelsAndRooms(users);
    const adminUser = users.find((u) => u.role === "admin");

    await createBookingsReviewsTransactions(users, hotels, rooms, focusHotel);
    await createSalePromotions(mainOwnerHotels);
    await createContactMessages(adminUser);

    console.log("\n=== Seed hoàn tất ===");
    console.log("Tài khoản thật (password: 123456):");
    console.log(`  Guest : ${REAL_ACCOUNTS.guest.email}`);
    console.log(`  Admin : ${REAL_ACCOUNTS.admin.email}`);
    console.log(`  Owner : ${REAL_ACCOUNTS.owner.email}`);
    console.log(`  Staff : ${REAL_ACCOUNTS.staff.email}`);
    console.log(`\nKS tập trung test: ${focusHotel.name} (${focusHotel._id})`);
  } catch (err) {
    console.error("Lỗi seed database:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = { seedDatabase };

if (require.main === module) {
  seedDatabase();
}
