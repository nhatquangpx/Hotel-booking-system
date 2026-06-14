const Hotel = require("../../models/Hotel");
const Room = require("../../models/Room");
const { staffCanAccessHotel, findHotelByStaffId } = require("./staffHotel");
const { ServiceError } = require("../../lib/http/serviceError");

async function resolveHotelTeamAccess(hotelId, user) {
  if (!hotelId) {
    throw new ServiceError(400, "ID khách sạn không được cung cấp");
  }

  if (user.role === "admin") {
    return { hotel: null, staffHotelId: null };
  }

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new ServiceError(404, "Không tìm thấy khách sạn");
  }

  if (hotel.ownerId.toString() === user.id) {
    return { hotel, staffHotelId: null };
  }

  if (user.role === "staff" && (await staffCanAccessHotel(user.id, hotelId))) {
    return { hotel, staffHotelId: hotel._id };
  }

  throw new ServiceError(403, "Bạn không có quyền thực hiện hành động này");
}

async function getStaffAssignedHotel(userId) {
  const hotel = await findHotelByStaffId(userId);
  if (!hotel) {
    throw new ServiceError(403, "Tài khoản nhân viên chưa được gán khách sạn");
  }
  return { hotel, staffHotelId: hotel._id };
}

async function resolveRoomTeamAccess(roomId, user) {
  if (!roomId) {
    throw new ServiceError(400, "ID phòng không được cung cấp");
  }

  if (user.role === "admin") {
    return { room: null, hotel: null, staffHotelId: null };
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throw new ServiceError(404, "Không tìm thấy phòng");
  }

  const hotel = await Hotel.findById(room.hotelId);
  if (!hotel) {
    throw new ServiceError(404, "Không tìm thấy khách sạn của phòng này");
  }

  if (hotel.ownerId.toString() === user.id) {
    return { room, hotel, staffHotelId: null };
  }

  if (user.role === "staff" && (await staffCanAccessHotel(user.id, hotel._id))) {
    return { room, hotel, staffHotelId: hotel._id };
  }

  throw new ServiceError(403, "Bạn không có quyền thực hiện hành động này");
}

module.exports = {
  resolveHotelTeamAccess,
  getStaffAssignedHotel,
  resolveRoomTeamAccess,
};
