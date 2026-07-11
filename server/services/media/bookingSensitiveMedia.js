const Booking = require("../../models/Booking");
const { checkBookingPermission } = require("../bookings/core");
const { staffCanAccessHotel } = require("../hotels/staffHotel");
const {
  getMediaField,
  hasSensitiveMedia,
  streamSensitiveMedia,
} = require("./sensitiveMedia");
const { ServiceError } = require("../../lib/http/serviceError");

function getHotelId(booking) {
  if (!booking?.hotel) return null;
  const hotel = booking.hotel;
  if (hotel._id) return hotel._id.toString();
  return hotel.toString();
}

async function assertCanViewSensitiveMedia(booking, user) {
  if (!booking || !user) {
    throw new ServiceError(403, "Bạn không có quyền xem ảnh này");
  }

  if (checkBookingPermission(booking, user)) {
    return;
  }

  if (user.role === "staff") {
    const hotelId = getHotelId(booking);
    if (hotelId && (await staffCanAccessHotel(user.id || user._id, hotelId))) {
      return;
    }
  }

  throw new ServiceError(403, "Bạn không có quyền xem ảnh này");
}

async function streamBookingSensitiveMedia({ bookingId, kind, user, res }) {
  const field = getMediaField(kind);
  if (!field) {
    throw new ServiceError(400, "Loại ảnh không hợp lệ");
  }

  const booking = await Booking.findById(bookingId).populate({
    path: "hotel",
    select: "ownerId",
  });

  if (!booking) {
    throw new ServiceError(404, "Không tìm thấy đơn đặt phòng");
  }

  await assertCanViewSensitiveMedia(booking, user);

  const ref = booking[field];
  if (!hasSensitiveMedia(ref)) {
    throw new ServiceError(404, "Đơn chưa có ảnh này");
  }

  await streamSensitiveMedia(res, ref);
}

module.exports = {
  assertCanViewSensitiveMedia,
  streamBookingSensitiveMedia,
};
