const Booking = require("../../models/Booking");
const { findHotelByStaffId, staffCanAccessHotel } = require("../../utils/staffHotel");
const { getBookingWithPopulate, refreshRoomBookingStatus } = require("./core");

const STAFF_BOOKING_POPULATE = {
  hotel: "name address images starRating contactInfo policies",
  room: "roomNumber type price images maxPeople description facilities",
  guest: "name email phone",
};

function throwHttp(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
}

function getHotelIdFromBooking(booking) {
  if (!booking?.hotel) return null;
  const hotel = booking.hotel;
  if (hotel._id) return hotel._id.toString();
  return hotel.toString();
}

async function assertStaffCanAccessBooking(booking, staffUserId) {
  const hotelId = getHotelIdFromBooking(booking);
  if (!hotelId || !(await staffCanAccessHotel(staffUserId, hotelId))) {
    throwHttp(403, "Bạn không có quyền thực hiện thao tác này");
  }
}

/** Một lần đọc DB + kiểm tra quyền staff (dùng cho check-in/out). */
async function loadBookingForStaff(bookingId, staffUserId) {
  const booking = await Booking.findById(bookingId);
  if (!booking) {
    throwHttp(404, "Đơn đặt phòng không tồn tại");
  }
  await assertStaffCanAccessBooking(booking, staffUserId);
  return booking;
}

const getBookingsByStaff = async (staffUserId) => {
  const hotel = await findHotelByStaffId(staffUserId);
  if (!hotel) {
    return [];
  }

  return Booking.find({ hotel: hotel._id })
    .populate({ path: "hotel", select: "name address" })
    .populate({ path: "room", select: "roomNumber type" })
    .populate({ path: "guest", select: "name email phone" })
    .sort({ createdAt: -1 });
};

const getBookingById = async (bookingId, user) => {
  const booking = await getBookingWithPopulate(bookingId, STAFF_BOOKING_POPULATE);
  if (!booking) {
    throwHttp(404, "Không tìm thấy đơn đặt phòng");
  }
  await assertStaffCanAccessBooking(booking, user.id);
  return booking;
};

const checkIn = async (bookingId, user) => {
  const booking = await loadBookingForStaff(bookingId, user.id);
  if (booking.paymentStatus !== "paid") {
    throwHttp(400, "Chỉ có thể check-in khi đơn đặt phòng đã được thanh toán");
  }
  if (booking.checkedInAt) {
    throwHttp(400, "Đơn đặt phòng đã được check-in trước đó");
  }
  booking.checkedInAt = new Date();
  await booking.save();
  if (booking.room) {
    await refreshRoomBookingStatus(booking.room);
  }
  return booking;
};

const checkOut = async (bookingId, user) => {
  const booking = await loadBookingForStaff(bookingId, user.id);
  if (!booking.checkedInAt) {
    throwHttp(400, "Bạn phải check-in trước khi check-out");
  }
  if (booking.checkedOutAt) {
    throwHttp(400, "Đơn đặt phòng đã được check-out trước đó");
  }
  booking.checkedOutAt = new Date();
  await booking.save();
  if (booking.room) {
    await refreshRoomBookingStatus(booking.room);
  }
  return booking;
};

module.exports = {
  getBookingsByStaff,
  getBookingById,
  checkIn,
  checkOut,
};
