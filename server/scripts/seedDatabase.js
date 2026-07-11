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
const HotelAddonService = require("../models/HotelAddonService");
const {
  buildSelectedAddonSnapshot,
} = require("../services/addon/addonPricing");

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
const { buildEquipmentForRoom } = require("./roomEquipmentSeed");

const COMMON_PASSWORD = "123456";
const MIN_USERS = 50;
const MIN_HOTELS = 50;
const MIN_BOOKINGS = 200;
const FOCUS_BOOKINGS = 50;
const FOCUS_HOTEL_NAME = "Silver Resort Nha Trang";
const FOCUS_HOTEL_CITY = "Nha Trang";
const FOCUS_HOTEL_STREETS = ["Trần Phú", "Yersin", "Lê Thánh Tôn", "Biệt Thự"];
const MIN_CONTACT_MESSAGES = 20;

/** Làm tròn về bội số 10.000 VNĐ (tối thiểu 10.000 nếu > 0). */
function roundToTenThousand(amount) {
  const n = Number(amount) || 0;
  if (n <= 0) return 0;
  return Math.max(10000, Math.round(n / 10000) * 10000);
}

/** Catalog dịch vụ đi kèm mẫu — mỗi KS lấy subset ngẫu nhiên */
const ADDON_TEMPLATES = [
  {
    name: "Buffet sáng",
    description: "Buffet sáng đa dạng món Á – Âu, phục vụ tại nhà hàng khách sạn.",
    price: 180000,
    category: "breakfast",
    pricingUnit: "per_person_per_night",
  },
  {
    name: "Bữa sáng tại phòng",
    description: "Đặt bữa sáng mang lên phòng theo giờ yêu cầu.",
    price: 220000,
    category: "breakfast",
    pricingUnit: "per_person_per_night",
  },
  {
    name: "Set lunch văn phòng",
    description: "Set ăn trưa 3 món, phù hợp khách công tác.",
    price: 250000,
    category: "lunch",
    pricingUnit: "per_person_per_stay",
  },
  {
    name: "Dinner set menu",
    description: "Thực đơn tối cố định kèm món tráng miệng.",
    price: 450000,
    category: "dinner",
    pricingUnit: "per_person_per_stay",
  },
  {
    name: "Tiệc tối lãng mạn",
    description: "Bàn riêng, trang trí nến và hoa cho 2 người.",
    price: 1200000,
    category: "dinner",
    pricingUnit: "per_stay",
  },
  {
    name: "Spa thư giãn 60 phút",
    description: "Liệu trình massage body thư giãn tại khu spa.",
    price: 550000,
    category: "spa",
    pricingUnit: "per_person_per_stay",
  },
  {
    name: "Xông hơi & sauna",
    description: "Sử dụng khu xông hơi trong suốt kỳ lưu trú.",
    price: 200000,
    category: "spa",
    pricingUnit: "per_person_per_stay",
  },
  {
    name: "Room service 24/7",
    description: "Phí dịch vụ mang đồ ăn/uống lên phòng cả ngày.",
    price: 80000,
    category: "room_service",
    pricingUnit: "per_night",
  },
  {
    name: "Minibar miễn phí",
    description: "Gói minibar nước ngọt và snack mỗi đêm.",
    price: 150000,
    category: "room_service",
    pricingUnit: "per_night",
  },
  {
    name: "Đưa đón sân bay",
    description: "Xe đưa đón 1 chiều từ/đến sân bay gần nhất.",
    price: 350000,
    category: "other",
    pricingUnit: "per_stay",
  },
  {
    name: "Thuê xe máy theo ngày",
    description: "Xe máy tự lái, bao gồm mũ bảo hiểm.",
    price: 120000,
    category: "other",
    pricingUnit: "per_night",
  },
  {
    name: "Gói trẻ em",
    description: "Giường phụ / nôi trẻ em và đồ chơi trong phòng.",
    price: 100000,
    category: "other",
    pricingUnit: "per_person_per_night",
  },
];

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
    const doc = {
      name: data.name,
      email: data.email.toLowerCase(),
      password: hashed,
      phone: data.phone || uniquePhone(phoneIndex++),
      role: data.role,
      status: "active",
    };
    if (data.role === "guest") {
      doc.idNumber =
        data.idNumber ||
        String(100000000000 + Math.floor(Math.random() * 899999999999)).slice(0, 12);
    }
    users.push(doc);
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
  let roomIndex = 0;

  for (let floor = 1; floor <= floors; floor += 1) {
    const countOnFloor = basePerFloor + (floor <= extra ? 1 : 0);
    for (let n = 1; n <= countOnFloor; n += 1) {
      const type = pickOne(ROOM_TYPES);
      const meta = ROOM_TYPE_META[type];
      const roomNumber = `${floor}${String(n).padStart(2, "0")}`;
      const roomDoc = {
        hotelId,
        roomNumber,
        type,
        description: `${meta.label} tầng ${floor}, diện tích ${randomInt(22, 45)}m², view ${pickOne(["thành phố", "biển", "núi", "vườn"])}.`,
        price: roundToTenThousand(meta.price + randomInt(-5, 10) * 10000),
        maxPeople: meta.maxPeople,
        facilities: pickMany(FACILITIES, randomInt(4, 7)),
        images: [
          `https://picsum.photos/seed/${hotelId}-${roomNumber}-1/800/600`,
          `https://picsum.photos/seed/${hotelId}-${roomNumber}-2/800/600`,
        ],
        roomStatus: Math.random() < 0.95 ? "active" : "maintenance",
        bookingStatus: "empty",
      };
      roomDoc.roomEquipment = buildEquipmentForRoom(roomDoc, roomIndex);
      roomIndex += 1;
      rooms.push(roomDoc);
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

    const isFocusHotel = i === 0;
    const addr = isFocusHotel
      ? {
          number: String(randomInt(1, 999)),
          street: pickOne(FOCUS_HOTEL_STREETS),
          city: FOCUS_HOTEL_CITY,
        }
      : randomAddress();

    hotelDocs.push({
      name: isFocusHotel ? FOCUS_HOTEL_NAME : randomHotelName(addr.city),
      ownerId: owner._id,
      description: isFocusHotel
        ? `Khách sạn 4 sao ven biển ${FOCUS_HOTEL_CITY}, view biển, tiện nghi hiện đại — KS tập trung test StayJourney.`
        : `Khách sạn ${randomInt(3, 5)} sao tại ${addr.city}, phục vụ khách du lịch và công tác. Tiện nghi hiện đại, nhân viên chuyên nghiệp.`,
      address: addr,
      images: [
        `https://picsum.photos/seed/hotel-${i}-1/1200/800`,
        `https://picsum.photos/seed/hotel-${i}-2/1200/800`,
        `https://picsum.photos/seed/hotel-${i}-3/1200/800`,
      ],
      starRating: isFocusHotel ? 4 : randomInt(3, 5),
      contactInfo: {
        phone: uniquePhone(50000 + i),
        email: `hotel${i + 1}@stayjourney-seed.test`,
      },
      policies: {
        checkInTime: "14:00",
        checkOutTime: "12:00",
        refundMinDaysBeforeCheckIn: 2,
      },
      status: isFocusHotel ? "active" : Math.random() < 0.92 ? "active" : "maintenance",
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
  console.log(`  ✓ Rooms: ${rooms.length} (tối thiểu 20/KS, 4-5 tầng, có roomEquipment)`);

  return { hotels, rooms, focusHotel, mainOwner, mainOwnerHotels };
}

async function createAddonServices(hotels, focusHotel) {
  const docs = [];

  for (const hotel of hotels) {
    const isFocus = String(hotel._id) === String(focusHotel._id);
    const templates = isFocus
      ? ADDON_TEMPLATES
      : pickMany(ADDON_TEMPLATES, randomInt(3, 6));

    for (const tpl of templates) {
      docs.push({
        hotelId: hotel._id,
        name: tpl.name,
        description: tpl.description,
        price: roundToTenThousand(tpl.price + randomInt(-2, 4) * 10000),
        category: tpl.category,
        pricingUnit: tpl.pricingUnit,
        isActive: Math.random() < 0.92,
      });
    }
  }

  const addons = await HotelAddonService.insertMany(docs);
  const byHotel = new Map();
  for (const addon of addons) {
    const key = String(addon.hotelId);
    if (!byHotel.has(key)) byHotel.set(key, []);
    byHotel.get(key).push(addon);
  }

  const focusCount = byHotel.get(String(focusHotel._id))?.length || 0;
  console.log(`  ✓ HotelAddonServices: ${addons.length} (KS tập trung: ${focusCount})`);
  return { addons, addonsByHotel: byHotel };
}

/**
 * Thời điểm tạo đơn — độc lập với check-in/check-out.
 * Luôn trước check-in và trải đều trong quá khứ gần đây.
 */
function pickBookingCreatedAt(checkIn, today) {
  const created = new Date(checkIn);
  // Đặt trước check-in từ 1–45 ngày (đơn tương lai có thể mới tạo gần đây)
  const daysBeforeCheckIn = randomInt(1, 45);
  created.setDate(created.getDate() - daysBeforeCheckIn);

  // Không để createdAt ở tương lai so với "hôm nay"
  if (created > today) {
    const daysAgo = randomInt(0, 60);
    created.setTime(today.getTime());
    created.setDate(created.getDate() - daysAgo);
    // Vẫn đảm bảo trước check-in nếu check-in đã qua
    if (created >= checkIn) {
      created.setTime(checkIn.getTime());
      created.setDate(created.getDate() - randomInt(1, 14));
    }
  }

  created.setHours(randomInt(7, 22), randomInt(0, 59), randomInt(0, 59), randomInt(0, 999));
  return created;
}

function pickPaymentStatus(isPast, { allowPending = true } = {}) {
  const r = Math.random();
  if (!allowPending) {
    // KS tập trung: chỉ paid / cancelled — không còn đơn chờ duyệt
    if (isPast) return r < 0.85 ? "paid" : "cancelled";
    return r < 0.8 ? "paid" : "cancelled";
  }
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

async function createBookingsReviewsTransactions(users, hotels, rooms, focusHotel, addonsByHotel) {
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

  const scheduleBooking = (hotel, guest, forcePast = null, options = {}) => {
    const hotelRooms = roomsByHotel.get(String(hotel._id)) || [];
    if (hotelRooms.length === 0) return false;
    const isFocus = String(hotel._id) === String(focusHotel._id);
    const allowPending = options.allowPending !== false && !isFocus;

    for (let attempt = 0; attempt < 40; attempt += 1) {
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

      const guestCount = randomInt(1, Math.min(room.maxPeople || 2, 4));
      const basePrice = roundToTenThousand(room.price * nights);
      const discountAmount =
        Math.random() < 0.2 ? roundToTenThousand(basePrice * 0.1) : 0;

      const hotelAddons = (addonsByHotel.get(String(hotel._id)) || []).filter((a) => a.isActive);
      let selectedAddons = [];
      let addonsAmount = 0;
      if (hotelAddons.length > 0 && Math.random() < 0.55) {
        const chosen = pickMany(hotelAddons, randomInt(1, Math.min(3, hotelAddons.length)));
        selectedAddons = chosen.map((service) => {
          const snap = buildSelectedAddonSnapshot(service, nights, guestCount);
          return { ...snap, price: roundToTenThousand(snap.price), lineTotal: roundToTenThousand(snap.lineTotal) };
        });
        addonsAmount = selectedAddons.reduce((sum, item) => sum + item.lineTotal, 0);
      }

      const finalAmount = roundToTenThousand(basePrice - discountAmount + addonsAmount);
      const isPast = checkOut < today;
      const paymentStatus = pickPaymentStatus(isPast, { allowPending });
      const paymentMethod = Math.random() < 0.65 ? "qr_code" : "vnpay";
      const createdAt = pickBookingCreatedAt(checkIn, today);

      const payload = {
        guest: guest._id,
        hotel: hotel._id,
        room: room._id,
        checkInDate: checkIn,
        checkOutDate: checkOut,
        guestCount,
        guestIdNumber: `${String(100000000000 + randomInt(0, 899999999999)).slice(0, 12)}`,
        selectedAddons,
        addonsAmount,
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
        createdAt,
        updatedAt: createdAt,
      };

      if (paymentStatus === "paid" && isPast) {
        payload.checkedInAt = addDays(checkIn, 0);
        payload.checkedInAt.setHours(15, 0, 0, 0);
        payload.checkedOutAt = addDays(checkOut, 0);
        payload.checkedOutAt.setHours(11, 0, 0, 0);
      }

      if (paymentStatus === "paid" && paymentMethod === "vnpay") {
        payload.vnpayPaidAt = addDays(createdAt, 0);
        payload.vnpayPaidAt.setMinutes(payload.vnpayPaidAt.getMinutes() + randomInt(5, 60));
        payload.vnpayOwnerVerifiedAt = addDays(payload.vnpayPaidAt, 0);
        payload.vnpayOwnerVerifiedAt.setHours(
          payload.vnpayOwnerVerifiedAt.getHours() + randomInt(1, 12)
        );
      }

      if (paymentStatus === "cancelled" && Math.random() < 0.5) {
        payload.cancellationReason = pickOne([
          "Thay đổi lịch trình",
          "Tìm được khách sạn khác",
          "Công việc đột xuất",
        ]);
        const cancelAt = addDays(createdAt, randomInt(0, 5));
        if (cancelAt < checkIn) {
          payload.guestCancelRequestedAt = cancelAt;
        } else {
          payload.guestCancelRequestedAt = addDays(checkIn, -randomInt(1, 3));
        }
      }

      existing.push({ checkInDate: checkIn, checkOutDate: checkOut });
      roomBookings.set(key, existing);
      bookingPayloads.push(payload);
      return true;
    }
    return false;
  };

  // ~50% past, ~50% upcoming/current — đủ đa dạng nhưng không pending
  const focusPastCount = Math.round(FOCUS_BOOKINGS * 0.55);
  for (let i = 0; i < focusPastCount; i += 1) {
    scheduleBooking(focusHotel, pickOne(guests), true);
  }
  for (let i = focusPastCount; i < FOCUS_BOOKINGS; i += 1) {
    scheduleBooking(focusHotel, pickOne(guests), i % 3 === 0 ? false : null);
  }

  const otherHotels = hotels.filter((h) => String(h._id) !== String(focusHotel._id));
  while (bookingPayloads.length < MIN_BOOKINGS) {
    const hotel = pickOne(otherHotels);
    const guest = pickOne(guests);
    if (!scheduleBooking(hotel, guest)) {
      scheduleBooking(
        pickOne(otherHotels.filter((h) => roomsByHotel.get(String(h._id))?.length)),
        pickOne(guests)
      );
    }
  }

  const bookings = await Booking.insertMany(bookingPayloads);

  const transactions = [];
  const reviews = [];

  bookings.forEach((booking, index) => {
    const txStatus = transactionStatusForPayment(booking.paymentStatus);
    const bookingCreatedAt = booking.createdAt ? new Date(booking.createdAt) : new Date();
    const txCreatedAt = new Date(bookingCreatedAt);
    txCreatedAt.setMinutes(txCreatedAt.getMinutes() + randomInt(1, 30));

    transactions.push({
      booking: booking._id,
      transactionRef: generateTransactionRef(booking._id, index),
      amount: booking.finalAmount,
      paymentMethod: booking.paymentMethod,
      status: txStatus,
      clientIp: `192.168.${randomInt(0, 255)}.${randomInt(1, 254)}`,
      createdAt: txCreatedAt,
      updatedAt: txCreatedAt,
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

    const reviewCreatedAt = booking.checkedOutAt
      ? addDays(booking.checkedOutAt, randomInt(0, 3))
      : addDays(booking.checkOutDate, randomInt(0, 2));

    reviews.push({
      guest: booking.guest,
      hotel: booking.hotel,
      booking: booking._id,
      rating: randomInt(3, 5),
      comment: pickOne(REVIEW_COMMENTS),
      createdAt: reviewCreatedAt,
      updatedAt: reviewCreatedAt,
      ...(Math.random() < 0.15
        ? {
            ownerResponse: "Cảm ơn quý khách đã lưu trú. Rất mong được đón tiếp lại!",
            ownerResponseAt: addDays(reviewCreatedAt, randomInt(1, 3)),
            replyRole: "owner",
          }
        : {}),
    });
  });

  await PaymentTransaction.insertMany(transactions);
  await Review.insertMany(reviews);

  const focusCount = bookings.filter((b) => String(b.hotel) === String(focusHotel._id)).length;
  const withAddons = bookings.filter((b) => (b.addonsAmount || 0) > 0).length;
  const focusPending = bookings.filter(
    (b) => String(b.hotel) === String(focusHotel._id) && b.paymentStatus === "pending"
  ).length;
  const focusByStatus = bookings
    .filter((b) => String(b.hotel) === String(focusHotel._id))
    .reduce((acc, b) => {
      acc[b.paymentStatus] = (acc[b.paymentStatus] || 0) + 1;
      return acc;
    }, {});
  const createdAts = bookings.map((b) => new Date(b.createdAt).getTime());
  const uniqueCreatedDays = new Set(
    bookings.map((b) => new Date(b.createdAt).toISOString().slice(0, 10))
  ).size;

  console.log(`  ✓ Bookings: ${bookings.length} (${focusCount} tại ${focusHotel.name}, pending KS này: ${focusPending})`);
  console.log(`  ✓ Focus paymentStatus: ${JSON.stringify(focusByStatus)}`);
  console.log(`  ✓ Booking createdAt: ${uniqueCreatedDays} ngày khác nhau (min/max lệch ${Math.round((Math.max(...createdAts) - Math.min(...createdAts)) / 86400000)} ngày)`);
  console.log(`  ✓ Có addon: ${withAddons} đơn | PaymentTransactions: ${transactions.length} | Reviews: ${reviews.length}`);
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
    const { addonsByHotel } = await createAddonServices(hotels, focusHotel);
    const adminUser = users.find((u) => u.role === "admin");

    await createBookingsReviewsTransactions(users, hotels, rooms, focusHotel, addonsByHotel);
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
