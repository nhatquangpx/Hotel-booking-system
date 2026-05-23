const Booking = require("../../models/Booking");
const { checkBookingPermission, refreshRoomBookingStatus } = require("./core");
const { staffCanAccessHotel } = require("../../utils/staffHotel");

function httpError(statusCode, message) {
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

async function assertHotelTeamBookingAccess(booking, user) {
  const userId = user?.id || user?._id;
  const role = user?.role;

  if (role === "owner") {
    if (!checkBookingPermission(booking, user)) {
      httpError(403, "Bạn không có quyền thực hiện thao tác này");
    }
    return;
  }

  if (role === "staff") {
    const hotelId = getHotelIdFromBooking(booking);
    if (!hotelId || !(await staffCanAccessHotel(userId, hotelId))) {
      httpError(403, "Bạn không có quyền thực hiện thao tác này");
    }
    return;
  }

  httpError(403, "Bạn không có quyền thực hiện thao tác này");
}

async function loadBookingForHotelTeam(bookingId, user) {
  const role = user?.role;
  let query = Booking.findById(bookingId);

  if (role === "owner") {
    query = query.populate({ path: "hotel", select: "ownerId" });
  }

  const booking = await query;
  if (!booking) {
    httpError(404, "Đơn đặt phòng không tồn tại");
  }

  await assertHotelTeamBookingAccess(booking, user);
  return booking;
}

async function performCheckIn(booking) {
  if (booking.paymentStatus !== "paid") {
    httpError(400, "Chỉ có thể check-in khi đơn đặt phòng đã được thanh toán");
  }
  if (booking.checkedInAt) {
    httpError(400, "Đơn đặt phòng đã được check-in trước đó");
  }

  booking.checkedInAt = new Date();
  await booking.save();

  if (booking.room) {
    await refreshRoomBookingStatus(booking.room);
  }

  return booking;
}

async function performCheckOut(booking) {
  if (!booking.checkedInAt) {
    httpError(400, "Bạn phải check-in trước khi check-out");
  }
  if (booking.checkedOutAt) {
    httpError(400, "Đơn đặt phòng đã được check-out trước đó");
  }

  booking.checkedOutAt = new Date();
  await booking.save();

  if (booking.room) {
    await refreshRoomBookingStatus(booking.room);
  }

  return booking;
}

async function checkInBooking(bookingId, user) {
  const booking = await loadBookingForHotelTeam(bookingId, user);
  return performCheckIn(booking);
}

async function checkOutBooking(bookingId, user) {
  const booking = await loadBookingForHotelTeam(bookingId, user);
  return performCheckOut(booking);
}

module.exports = {
  checkInBooking,
  checkOutBooking,
  loadBookingForHotelTeam,
  performCheckIn,
  performCheckOut,
};
