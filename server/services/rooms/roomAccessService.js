const Hotel = require("../../models/Hotel");
const Room = require("../../models/Room");
const User = require("../../models/User");
const { staffCanAccessHotel } = require("../hotels/staffHotel");
const { ServiceError } = require("../../lib/http/serviceError");

async function getUserDisplayName(userId) {
  if (!userId) return "";
  const user = await User.findById(userId).select("name").lean();
  return user?.name ? String(user.name).trim() : "";
}

async function assertHotelOwnedByUser(hotelId, userId) {
  const hotel = await Hotel.findById(hotelId).select("ownerId");
  if (!hotel) throw new ServiceError(404, "Không tìm thấy khách sạn");
  if (hotel.ownerId.toString() !== userId) {
    throw new ServiceError(403, "Bạn không có quyền thực hiện hành động này");
  }
  return hotel;
}

async function assertRoomOwnedByUser(roomId, userId) {
  const room = await Room.findById(roomId).select("hotelId");
  if (!room) throw new ServiceError(404, "Không tìm thấy phòng");
  await assertHotelOwnedByUser(room.hotelId.toString(), userId);
  return room;
}

async function assertStaffRoomAccess(roomId, userId) {
  const room = await Room.findById(roomId).select("hotelId");
  if (!room) throw new ServiceError(404, "Không tìm thấy phòng");
  const allowed = await staffCanAccessHotel(userId, room.hotelId.toString());
  if (!allowed) throw new ServiceError(403, "Bạn không có quyền thực hiện hành động này");
  return room;
}

module.exports = {
  getUserDisplayName,
  assertHotelOwnedByUser,
  assertRoomOwnedByUser,
  assertStaffRoomAccess,
};
