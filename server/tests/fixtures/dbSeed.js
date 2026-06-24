/**
 * FIXTURE HẠ TẦNG — không phải logic test.
 * Chuẩn bị môi trường DB; các file *.test.js chỉ được gọi HTTP API (black box).
 */
const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const Hotel = require("../../models/Hotel");
const Room = require("../../models/Room");
const Booking = require("../../models/Booking");
const ContactMessage = require("../../models/ContactMessage");
const SalePromotion = require("../../models/SalePromotion");

const TEST_PASSWORD = "123456";

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toIsoDate(date) {
  return date.toISOString().split("T")[0];
}

function futureStayDates({ checkInOffset = 1, nights = 2 } = {}) {
  const checkIn = addDays(new Date(), checkInOffset);
  const checkOut = addDays(checkIn, nights);
  return {
    checkInDate: checkIn.toISOString(),
    checkOutDate: checkOut.toISOString(),
  };
}

async function seedDatabaseFixture() {
  const hashed = await bcrypt.hash(TEST_PASSWORD, await bcrypt.genSalt());

  const [admin, owner, staff, guest, guest2, otherOwner, unassignedStaff] =
    await User.insertMany([
      {
        name: "Admin Test",
        email: "admin@test.com",
        password: hashed,
        phone: "0900000001",
        role: "admin",
        status: "active",
      },
      {
        name: "Owner Test",
        email: "owner@test.com",
        password: hashed,
        phone: "0900000002",
        role: "owner",
        status: "active",
      },
      {
        name: "Staff Test",
        email: "staff@test.com",
        password: hashed,
        phone: "0900000003",
        role: "staff",
        status: "active",
      },
      {
        name: "Guest Test",
        email: "guest@test.com",
        password: hashed,
        phone: "0900000004",
        role: "guest",
        status: "active",
      },
      {
        name: "Guest Two",
        email: "guest2@test.com",
        password: hashed,
        phone: "0900000005",
        role: "guest",
        status: "active",
      },
      {
        name: "Other Owner",
        email: "otherowner@test.com",
        password: hashed,
        phone: "0900000006",
        role: "owner",
        status: "active",
      },
      {
        name: "Unassigned Staff",
        email: "unassigned@test.com",
        password: hashed,
        phone: "0944444444",
        role: "staff",
        status: "active",
      },
    ]);

  const hotel = await Hotel.create({
    name: "Khách sạn Test",
    ownerId: owner._id,
    description: "Mô tả khách sạn test",
    address: { number: "123", street: "Đường Test", city: "Hà Nội" },
    images: ["https://example.com/hotel.jpg"],
    starRating: 4,
    contactInfo: { phone: "0241234567", email: "hotel@test.com" },
    status: "active",
    staffIds: [staff._id],
    maintenanceContactEmail: "repair@test.com",
    paymentConfig: {
      qr: {
        accountName: "Owner Test",
        accountNumber: "9876543210",
        bankName: "Vietcombank",
        qrImageUrl: "https://example.com/qr.png",
      },
      vnpay: {
        tmnCode: "TEST_TMN",
        secureSecret: "TEST_SECRET_KEY_FOR_VNPAY",
      },
    },
  });

  const inactiveHotel = await Hotel.create({
    name: "KS Không nhận đặt",
    ownerId: otherOwner._id,
    description: "Khách sạn inactive",
    address: { number: "1", street: "Inactive", city: "Đà Nẵng" },
    images: [],
    starRating: 3,
    contactInfo: { phone: "0236123456", email: "inactive@test.com" },
    status: "inactive",
  });

  const [room, room2] = await Room.insertMany([
    {
      hotelId: hotel._id,
      roomNumber: "101",
      type: "standard",
      description: "Phòng standard test",
      price: 500000,
      maxPeople: 2,
      facilities: ["wifi", "tv"],
      images: ["https://example.com/room.jpg"],
      roomStatus: "active",
      bookingStatus: "empty",
    },
    {
      hotelId: hotel._id,
      roomNumber: "102",
      type: "deluxe",
      description: "Phòng deluxe test",
      price: 800000,
      maxPeople: 3,
      facilities: ["wifi", "tv", "minibar"],
      images: [],
      roomStatus: "active",
      bookingStatus: "empty",
    },
  ]);

  const { checkInDate, checkOutDate } = futureStayDates({ checkInOffset: 5, nights: 2 });

  const pendingBooking = await Booking.create({
    guest: guest._id,
    hotel: hotel._id,
    room: room._id,
    checkInDate: new Date(checkInDate),
    checkOutDate: new Date(checkOutDate),
    finalAmount: 1000000,
    basePrice: 1000000,
    discountAmount: 0,
    paymentStatus: "pending",
    paymentMethod: "qr_code",
  });

  const contactMessage = await ContactMessage.create({
    name: "Người liên hệ",
    email: "contact@test.com",
    phone: "0912345678",
    subject: "Hỏi về đặt phòng",
    message: "Tôi muốn hỏi về giá phòng cuối tuần",
    status: "pending",
  });

  const sale = await SalePromotion.create({
    hotelId: hotel._id,
    title: "Giảm giá test",
    scope: "hotel",
    startDate: toIsoDate(addDays(new Date(), -1)),
    endDate: toIsoDate(addDays(new Date(), 30)),
    discountPercent: 10,
    isActive: true,
  });

  return {
    password: TEST_PASSWORD,
    credentials: {
      admin: { email: admin.email },
      owner: { email: owner.email },
      staff: { email: staff.email },
      guest: { email: guest.email },
      guest2: { email: guest2.email },
      otherOwner: { email: otherOwner.email },
      unassignedStaff: { email: unassignedStaff.email },
    },
    hotelId: String(hotel._id),
    inactiveHotelId: String(inactiveHotel._id),
    roomId: String(room._id),
    roomIdDeluxe: String(room2._id),
    pendingBookingId: String(pendingBooking._id),
    contactMessageId: String(contactMessage._id),
    saleId: String(sale._id),
    userIds: {
      guest: String(guest._id),
      owner: String(owner._id),
    },
    hotelName: "Khách sạn Test",
    futureStayDates,
    addDays,
    toIsoDate,
  };
}

module.exports = {
  TEST_PASSWORD,
  seedDatabaseFixture,
};
