const { hasCloudinaryConfig } = require("../../config/multerConfig");
const roomService = require("./roomService");
const roomEquipmentService = require("./roomEquipmentService");
const roomAccess = require("./roomAccessService");
const bookingService = require("../bookings");
const { ServiceError } = require("../../lib/http/serviceError");

async function getRoomsByHotel({ req, hotelId }) {
  if (req.user?.role === "owner" && req.baseUrl === "/api/owner") {
    await roomAccess.assertHotelOwnedByUser(hotelId, req.user.id);
  }
  const rooms = await roomService.listRoomsByHotel(hotelId, req.query);
  return { status: 200, body: rooms };
}

async function getRoomById({ req, id }) {
  if (req.user?.role === "owner" && req.baseUrl === "/api/owner") {
    await roomAccess.assertRoomOwnedByUser(id, req.user.id);
  }
  if (req.user?.role === "staff") {
    await roomAccess.assertStaffRoomAccess(id, req.user.id);
  }
  const room = await roomService.getRoomById(id);
  if (!room) throw new ServiceError(404, "Không tìm thấy phòng");
  return { status: 200, body: room };
}

async function createRoom({ req }) {
  let hotelId;
  if (req.params.hotelId) {
    hotelId = req.params.hotelId;
    await roomAccess.assertHotelOwnedByUser(hotelId, req.user.id);
  } else if (req.user.role === "admin") {
    hotelId = req.body.hotelId;
    if (!hotelId) throw new ServiceError(400, "hotelId là bắt buộc");
  } else {
    throw new ServiceError(403, "Bạn không có quyền tạo phòng theo cách này");
  }

  const savedRoom = await roomService.createRoom({
    hotelId,
    roomNumber: req.body.roomNumber,
    type: req.body.type,
    price: req.body.price,
    maxPeople: req.body.maxPeople,
    description: req.body.description,
    facilities: req.body.facilities,
    roomStatus: req.body.roomStatus,
    files: req.files,
    hasCloudinary: hasCloudinaryConfig,
  });

  return { status: 201, body: savedRoom };
}

async function updateRoom({ req, id }) {
  let body = req.body;
  if (req.user.role === "owner") {
    await roomAccess.assertRoomOwnedByUser(id, req.user.id);
    body = { ...req.body };
    delete body.hotelId;
  }

  const updatedRoom = await roomService.updateRoom(id, body, req.files, hasCloudinaryConfig);
  return { status: 200, body: updatedRoom };
}

async function deleteRoom({ req, id }) {
  if (req.user.role === "owner") {
    await roomAccess.assertRoomOwnedByUser(id, req.user.id);
  }
  await roomService.deleteRoom(id);
  return { status: 200, body: { message: "Đã xóa phòng thành công" } };
}

async function getStaffRooms({ req }) {
  const hotelId = req.staffHotelId?.toString();
  if (!hotelId) throw new ServiceError(403, "Tài khoản nhân viên chưa được gán khách sạn");
  const rooms = await roomService.listRoomsByHotel(hotelId, req.query);
  return { status: 200, body: rooms };
}

async function updateStaffRoomStatus({ req, id, roomStatus }) {
  if (!roomStatus) throw new ServiceError(400, "roomStatus là bắt buộc");
  await roomAccess.assertStaffRoomAccess(id, req.user.id);
  const updatedRoom = await roomService.updateRoomStatusOnly(id, roomStatus);
  return { status: 200, body: updatedRoom };
}

async function postStaffEquipmentRepairRequest({ req }) {
  const staffName = await roomAccess.getUserDisplayName(req.user.id);
  const { count } = await roomEquipmentService.postStaffEquipmentRepairRequest(
    req.user.id,
    staffName,
    req.body?.items
  );
  return { status: 200, body: { message: "Đã gửi email báo sửa chữa", count } };
}

async function postOwnerEquipmentRepairRequest({ req, hotelId }) {
  const ownerName = await roomAccess.getUserDisplayName(req.user.id);
  const { count } = await roomEquipmentService.postOwnerEquipmentRepairRequest(
    hotelId,
    req.user.id,
    ownerName,
    req.body?.items
  );
  return { status: 200, body: { message: "Đã gửi email báo sửa chữa", count } };
}

async function getOwnerRoomEquipment({ hotelId, ownerId }) {
  const body = await roomEquipmentService.getOwnerRoomEquipmentForHotel(hotelId, ownerId);
  return { status: 200, body };
}

async function postOwnerRoomEquipment({ roomId, ownerId, body }) {
  const result = await roomEquipmentService.postOwnerRoomEquipment(roomId, ownerId, body);
  return { status: 201, body: result };
}

async function patchOwnerRoomEquipment({ roomId, equipmentId, ownerId, body }) {
  const result = await roomEquipmentService.patchOwnerRoomEquipment(
    roomId,
    equipmentId,
    ownerId,
    body
  );
  return { status: 200, body: result };
}

async function deleteOwnerRoomEquipment({ roomId, equipmentId, ownerId }) {
  const result = await roomEquipmentService.deleteOwnerRoomEquipment(
    roomId,
    equipmentId,
    ownerId
  );
  return { status: 200, body: result };
}

async function getStaffRoomEquipment({ staffId }) {
  const body = await roomEquipmentService.getStaffRoomEquipmentForHotel(staffId);
  return { status: 200, body };
}

async function postStaffRoomEquipment({ roomId, staffId, body }) {
  const result = await roomEquipmentService.postStaffRoomEquipment(roomId, staffId, body);
  return { status: 201, body: result };
}

async function patchStaffRoomEquipment({ roomId, equipmentId, staffId, body }) {
  const result = await roomEquipmentService.patchStaffRoomEquipment(
    roomId,
    equipmentId,
    staffId,
    body
  );
  return { status: 200, body: result };
}

async function deleteStaffRoomEquipment({ roomId, equipmentId, staffId }) {
  const result = await roomEquipmentService.deleteStaffRoomEquipment(
    roomId,
    equipmentId,
    staffId
  );
  return { status: 200, body: result };
}

async function getOwnerRoomBookings({ ownerId, roomId }) {
  const body = await bookingService.getBookingsByRoomForOwner(ownerId, roomId);
  return { status: 200, body };
}

module.exports = {
  getRoomsByHotel,
  getRoomById,
  createRoom,
  updateRoom,
  deleteRoom,
  getStaffRooms,
  updateStaffRoomStatus,
  postStaffEquipmentRepairRequest,
  postOwnerEquipmentRepairRequest,
  getOwnerRoomEquipment,
  postOwnerRoomEquipment,
  patchOwnerRoomEquipment,
  deleteOwnerRoomEquipment,
  getStaffRoomEquipment,
  postStaffRoomEquipment,
  patchStaffRoomEquipment,
  deleteStaffRoomEquipment,
  getOwnerRoomBookings,
};
