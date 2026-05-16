const { hasCloudinaryConfig } = require("../config/multerConfig");
const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const roomService = require("../services/rooms/roomService");
const roomEquipmentService = require("../services/rooms/roomEquipmentService");
const { staffCanAccessHotel } = require("../utils/staffHotel");

function throwHttp(statusCode, message) {
  const e = new Error(message);
  e.statusCode = statusCode;
  throw e;
}

/** Chủ KS: khách sạn phải tồn tại và thuộc user. */
async function assertHotelOwnedByUser(hotelId, userId) {
  const hotel = await Hotel.findById(hotelId).select("ownerId");
  if (!hotel) {
    throwHttp(404, "Không tìm thấy khách sạn");
  }
  if (hotel.ownerId.toString() !== userId) {
    throwHttp(403, "Bạn không có quyền thực hiện hành động này");
  }
  return hotel;
}

/** Chủ KS: phòng phải thuộc một khách sạn của user. */
async function assertRoomOwnedByUser(roomId, userId) {
  const room = await Room.findById(roomId).select("hotelId");
  if (!room) {
    throwHttp(404, "Không tìm thấy phòng");
  }
  await assertHotelOwnedByUser(room.hotelId.toString(), userId);
  return room;
}

/** Nhân viên: phòng thuộc khách sạn đã gán. */
async function assertStaffRoomAccess(roomId, userId) {
  const room = await Room.findById(roomId).select("hotelId");
  if (!room) {
    throwHttp(404, "Không tìm thấy phòng");
  }
  const allowed = await staffCanAccessHotel(userId, room.hotelId.toString());
  if (!allowed) {
    throwHttp(403, "Bạn không có quyền thực hiện hành động này");
  }
  return room;
}

function handleServiceError(res, error, logLabel, fallbackMessage) {
  if (error && error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(logLabel, error);
  return res.status(500).json({ message: fallbackMessage, error: error.message });
}

// Get all rooms for a specific hotel
exports.getRoomsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    if (req.user?.role === "owner" && req.baseUrl === "/api/owner") {
      await assertHotelOwnedByUser(hotelId, req.user.id);
    }
    const rooms = await roomService.listRoomsByHotel(hotelId, req.query);
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phòng:", error);
    return handleServiceError(res, error, "Lỗi khi lấy danh sách phòng:", "Lỗi khi lấy danh sách phòng");
  }
};

// Get room by ID
exports.getRoomById = async (req, res) => {
  try {
    console.log(`Lấy thông tin phòng ID: ${req.params.id}`);
    if (req.user?.role === "owner" && req.baseUrl === "/api/owner") {
      await assertRoomOwnedByUser(req.params.id, req.user.id);
    }
    if (req.user?.role === "staff") {
      await assertStaffRoomAccess(req.params.id, req.user.id);
    }
    const room = await roomService.getRoomById(req.params.id);

    if (!room) {
      console.log(`Không tìm thấy phòng với ID: ${req.params.id}`);
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    console.log(`Đã tìm thấy phòng thuộc khách sạn: ${room.hotelId ? room.hotelId._id : ""}`);
    res.status(200).json(room);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin phòng:", error);
    return handleServiceError(res, error, "Lỗi khi lấy thông tin phòng:", "Lỗi khi lấy thông tin phòng");
  }
};

// Create new room (admin/owner)
exports.createRoom = async (req, res) => {
  try {
    console.log("Dữ liệu phòng:", req.body);
    console.log("Files:", req.files);

    let hotelId;
    if (req.params.hotelId) {
      hotelId = req.params.hotelId;
      await assertHotelOwnedByUser(hotelId, req.user.id);
    } else if (req.user.role === "admin") {
      hotelId = req.body.hotelId;
      if (!hotelId) {
        return res.status(400).json({ message: "hotelId là bắt buộc" });
      }
    } else {
      return res.status(403).json({ message: "Bạn không có quyền tạo phòng theo cách này" });
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

    console.log("Đã tạo phòng thành công:", savedRoom);
    res.status(201).json(savedRoom);
  } catch (error) {
    return handleServiceError(res, error, "Lỗi khi tạo phòng:", "Lỗi khi tạo phòng");
  }
};

// Update room (admin/owner)
exports.updateRoom = async (req, res) => {
  try {
    console.log(`Đang cập nhật phòng ID: ${req.params.id}`);
    console.log("Dữ liệu cập nhật:", JSON.stringify(req.body));

    let body = req.body;
    if (req.user.role === "owner") {
      await assertRoomOwnedByUser(req.params.id, req.user.id);
      body = { ...req.body };
      delete body.hotelId;
    }

    const updatedRoom = await roomService.updateRoom(
      req.params.id,
      body,
      req.files,
      hasCloudinaryConfig
    );

    console.log(`Đã cập nhật phòng thành công: ${updatedRoom.roomNumber}`);
    res.status(200).json(updatedRoom);
  } catch (error) {
    return handleServiceError(res, error, "Lỗi khi cập nhật phòng:", "Lỗi khi cập nhật phòng");
  }
};

// Delete room (admin/owner)
exports.deleteRoom = async (req, res) => {
  try {
    console.log(`Đang xóa phòng ID: ${req.params.id}`);
    if (req.user.role === "owner") {
      await assertRoomOwnedByUser(req.params.id, req.user.id);
    }
    await roomService.deleteRoom(req.params.id);
    console.log(`Đã xóa phòng thành công ID: ${req.params.id}`);
    res.status(200).json({ message: "Đã xóa phòng thành công" });
  } catch (error) {
    return handleServiceError(res, error, "Lỗi khi xóa phòng:", "Lỗi khi xóa phòng");
  }
};

/** Owner: danh sách phòng + trang thiết bị (theo khách sạn). */
exports.getOwnerRoomEquipment = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const payload = await roomEquipmentService.getOwnerRoomEquipmentForHotel(hotelId, req.user.id);
    res.status(200).json(payload);
  } catch (error) {
    return handleServiceError(res, error, "Lỗi khi lấy trang thiết bị phòng:", "Lỗi khi lấy danh sách thiết bị");
  }
};

/** Owner: thêm thiết bị vào phòng (thủ công, không liên kết tiện ích). */
exports.postOwnerRoomEquipment = async (req, res) => {
  try {
    const { roomId } = req.params;
    const data = await roomEquipmentService.postOwnerRoomEquipment(roomId, req.user.id, req.body);
    res.status(201).json(data);
  } catch (error) {
    return handleServiceError(res, error, "Lỗi khi thêm thiết bị:", "Lỗi khi thêm thiết bị");
  }
};

/** Owner: cập nhật tên và/hoặc trạng thái thiết bị. */
exports.patchOwnerRoomEquipment = async (req, res) => {
  try {
    const { roomId, equipmentId } = req.params;
    const data = await roomEquipmentService.patchOwnerRoomEquipment(roomId, equipmentId, req.user.id, req.body);
    res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error, "Lỗi khi cập nhật thiết bị:", "Lỗi khi cập nhật thiết bị");
  }
};

/** Owner: xóa một thiết bị khỏi phòng. */
exports.deleteOwnerRoomEquipment = async (req, res) => {
  try {
    const { roomId, equipmentId } = req.params;
    const data = await roomEquipmentService.deleteOwnerRoomEquipment(roomId, equipmentId, req.user.id);
    res.status(200).json(data);
  } catch (error) {
    return handleServiceError(res, error, "Lỗi khi xóa thiết bị:", "Lỗi khi xóa thiết bị");
  }
};

/** Staff: danh sách phòng khách sạn đã gán (req.staffHotelId từ attachStaffHotel). */
exports.getStaffRooms = async (req, res) => {
  try {
    const hotelId = req.staffHotelId?.toString();
    if (!hotelId) {
      return res.status(403).json({ message: "Tài khoản nhân viên chưa được gán khách sạn" });
    }
    const rooms = await roomService.listRoomsByHotel(hotelId, req.query);
    res.status(200).json(rooms);
  } catch (error) {
    return handleServiceError(res, error, "Lỗi khi lấy danh sách phòng:", "Lỗi khi lấy danh sách phòng");
  }
};

/** Staff: chỉ cập nhật roomStatus (logic giống owner). */
exports.updateStaffRoomStatus = async (req, res) => {
  try {
    const { roomStatus } = req.body || {};
    if (!roomStatus) {
      return res.status(400).json({ message: "roomStatus là bắt buộc" });
    }
    await assertStaffRoomAccess(req.params.id, req.user.id);
    const updatedRoom = await roomService.updateRoomStatusOnly(req.params.id, roomStatus);
    res.status(200).json(updatedRoom);
  } catch (error) {
    return handleServiceError(
      res,
      error,
      "Lỗi khi cập nhật trạng thái phòng:",
      "Lỗi khi cập nhật trạng thái phòng"
    );
  }
};

/** Owner: gửi email báo thiết bị hỏng tới địa chỉ bảo trì đã lưu. */
exports.postOwnerEquipmentRepairRequest = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { items } = req.body || {};
    const ownerName = req.user?.name ? String(req.user.name).trim() : "";
    const { count } = await roomEquipmentService.postOwnerEquipmentRepairRequest(
      hotelId,
      req.user.id,
      ownerName,
      items
    );
    res.status(200).json({ message: "Đã gửi email báo sửa chữa", count });
  } catch (error) {
    return handleServiceError(res, error, "Lỗi khi gửi email báo sửa chữa:", "Lỗi khi gửi email");
  }
};
