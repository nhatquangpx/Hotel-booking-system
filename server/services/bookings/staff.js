const Booking = require("../../models/Booking");
const { findHotelByStaffId, staffCanAccessHotel } = require("../../services/hotels/staffHotel");
const { getBookingWithPopulate } = require("./core");
const { checkInBooking, checkOutBooking } = require("./hotelTeam");

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

const checkIn = checkInBooking;
const checkOut = checkOutBooking;

module.exports = {
  getBookingsByStaff,
  getBookingById,
  checkIn,
  checkOut,
};
