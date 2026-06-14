const mongoose = require("mongoose");
const Room = require("../../models/Room");
const Hotel = require("../../models/Hotel");
const { findHotelByStaffId } = require("../../services/hotels/staffHotel");
const { sendMaintenanceRepairRequestEmail } = require("../emails/maintenanceRepairEmail");

const EQUIPMENT_STATUSES = ["operational", "under_repair", "broken"];
const EQUIPMENT_NAME_MAX = 120;

function throwHttp(statusCode, message) {
  const e = new Error(message);
  e.statusCode = statusCode;
  throw e;
}

async function loadRoomOwnedByUser(roomId, ownerUserId) {
  const room = await Room.findById(roomId).select("+roomEquipment");
  if (!room) {
    return { error: "not_found", room: null };
  }
  const hotel = await Hotel.findOne({ _id: room.hotelId, ownerId: ownerUserId });
  if (!hotel) {
    return { error: "forbidden", room: null };
  }
  return { room, hotel, error: null };
}

async function loadRoomForStaff(roomId, staffUserId) {
  const room = await Room.findById(roomId).select("+roomEquipment");
  if (!room) {
    return { error: "not_found", room: null };
  }
  if (!room.hotelId) {
    return { error: "forbidden", room: null };
  }
  const hotel = await Hotel.findOne({
    _id: room.hotelId,
    staffIds: staffUserId,
  }).select("_id");
  if (!hotel) {
    return { error: "forbidden", room: null };
  }
  return { room, error: null };
}

function equipmentNameDuplicate(room, nameNorm, excludeEquipmentId) {
  return (room.roomEquipment || []).some((e) => {
    if (excludeEquipmentId && e._id && e._id.toString() === excludeEquipmentId) {
      return false;
    }
    return (e.name || "").trim().toLowerCase() === nameNorm;
  });
}

async function getRoomEquipmentForHotel(hotelId) {
  const rooms = await Room.find({ hotelId })
    .select("_id roomNumber type +roomEquipment")
    .sort({ roomNumber: 1 });
  return {
    rooms: rooms.map((room) => ({
      _id: room._id,
      roomNumber: room.roomNumber,
      type: room.type,
      roomEquipment: room.roomEquipment || [],
    })),
  };
}

async function getOwnerRoomEquipmentForHotel(hotelId, ownerUserId) {
  const hotel = await Hotel.findOne({ _id: hotelId, ownerId: ownerUserId });
  if (!hotel) {
    throwHttp(404, "Không tìm thấy khách sạn hoặc bạn không có quyền truy cập");
  }
  return getRoomEquipmentForHotel(hotelId);
}

async function getStaffRoomEquipmentForHotel(staffUserId) {
  const hotel = await findHotelByStaffId(staffUserId);
  if (!hotel) {
    throwHttp(403, "Tài khoản nhân viên chưa được gán khách sạn");
  }
  return getRoomEquipmentForHotel(hotel._id);
}

async function postRoomEquipment(roomId, loadRoom, body = {}) {
  let { name, status = "operational" } = body;
  name = typeof name === "string" ? name.trim() : "";
  if (!name || name.length > EQUIPMENT_NAME_MAX) {
    throwHttp(400, `Tên thiết bị bắt buộc, tối đa ${EQUIPMENT_NAME_MAX} ký tự`);
  }
  if (!EQUIPMENT_STATUSES.includes(status)) {
    throwHttp(400, "Trạng thái không hợp lệ");
  }

  const { room, error } = await loadRoom(roomId);
  if (error === "not_found") throwHttp(404, "Không tìm thấy phòng");
  if (error === "forbidden") throwHttp(403, "Bạn không có quyền cập nhật phòng này");

  const nameNorm = name.toLowerCase();
  if (equipmentNameDuplicate(room, nameNorm, null)) {
    throwHttp(400, "Đã có thiết bị cùng tên trong phòng");
  }

  room.roomEquipment.push({ name, status });
  await room.save();

  return {
    roomId: room._id,
    roomNumber: room.roomNumber,
    roomEquipment: room.roomEquipment,
  };
}

async function patchRoomEquipment(roomId, equipmentId, loadRoom, body = {}) {
  const { status, name } = body;
  const hasStatus = status !== undefined && status !== null && status !== "";
  const hasName = name !== undefined && name !== null;

  if (!hasStatus && !hasName) {
    throwHttp(400, "Cần gửi name và/hoặc status");
  }

  const { room, error } = await loadRoom(roomId);
  if (error === "not_found") throwHttp(404, "Không tìm thấy phòng");
  if (error === "forbidden") throwHttp(403, "Bạn không có quyền cập nhật phòng này");

  const item = room.roomEquipment.id(equipmentId);
  if (!item) {
    throwHttp(404, "Không tìm thấy thiết bị");
  }

  if (hasName) {
    const trimmed = typeof name === "string" ? name.trim() : "";
    if (!trimmed || trimmed.length > EQUIPMENT_NAME_MAX) {
      throwHttp(400, `Tên thiết bị không hợp lệ (1–${EQUIPMENT_NAME_MAX} ký tự)`);
    }
    const nameNorm = trimmed.toLowerCase();
    if (equipmentNameDuplicate(room, nameNorm, equipmentId)) {
      throwHttp(400, "Đã có thiết bị cùng tên trong phòng");
    }
    item.name = trimmed;
  }

  if (hasStatus) {
    if (!EQUIPMENT_STATUSES.includes(status)) {
      throwHttp(400, "Trạng thái không hợp lệ");
    }
    item.status = status;
  }

  await room.save();

  return {
    roomId: room._id,
    roomNumber: room.roomNumber,
    roomEquipment: room.roomEquipment,
  };
}

async function deleteRoomEquipment(roomId, equipmentId, loadRoom) {
  const { room, error } = await loadRoom(roomId);
  if (error === "not_found") throwHttp(404, "Không tìm thấy phòng");
  if (error === "forbidden") throwHttp(403, "Bạn không có quyền cập nhật phòng này");

  const item = room.roomEquipment.id(equipmentId);
  if (!item) {
    throwHttp(404, "Không tìm thấy thiết bị");
  }

  room.roomEquipment.pull(equipmentId);
  await room.save();

  return {
    roomId: room._id,
    roomNumber: room.roomNumber,
    roomEquipment: room.roomEquipment,
  };
}

async function postOwnerRoomEquipment(roomId, ownerUserId, body = {}) {
  return postRoomEquipment(roomId, (id) => loadRoomOwnedByUser(id, ownerUserId), body);
}

async function patchOwnerRoomEquipment(roomId, equipmentId, ownerUserId, body = {}) {
  return patchRoomEquipment(roomId, equipmentId, (id) => loadRoomOwnedByUser(id, ownerUserId), body);
}

async function deleteOwnerRoomEquipment(roomId, equipmentId, ownerUserId) {
  return deleteRoomEquipment(roomId, equipmentId, (id) => loadRoomOwnedByUser(id, ownerUserId));
}

async function postStaffRoomEquipment(roomId, staffUserId, body = {}) {
  return postRoomEquipment(roomId, (id) => loadRoomForStaff(id, staffUserId), body);
}

async function patchStaffRoomEquipment(roomId, equipmentId, staffUserId, body = {}) {
  return patchRoomEquipment(roomId, equipmentId, (id) => loadRoomForStaff(id, staffUserId), body);
}

async function deleteStaffRoomEquipment(roomId, equipmentId, staffUserId) {
  return deleteRoomEquipment(roomId, equipmentId, (id) => loadRoomForStaff(id, staffUserId));
}

/**
 * @param {import('../../models/Hotel')} hotel
 * @param {string} requesterName
 * @param {Array<{ roomId?: unknown, equipmentId?: unknown }>} items
 * @param {"owner"|"staff"} [requesterRole="owner"]
 */
async function sendEquipmentRepairRequestForHotel(hotel, requesterName, items, requesterRole = "owner") {
  if (!Array.isArray(items) || items.length === 0) {
    throwHttp(400, "Cần chọn ít nhất một thiết bị để gửi báo cáo");
  }

  const to = String(hotel.maintenanceContactEmail || "").trim();
  if (!to) {
    throwHttp(400, "Vui lòng lưu email bên sửa chữa trước khi gửi báo cáo");
  }

  const normalized = [];
  const seen = new Set();
  for (const raw of items) {
    const roomId = raw?.roomId != null ? String(raw.roomId).trim() : "";
    const equipmentId = raw?.equipmentId != null ? String(raw.equipmentId).trim() : "";
    if (!roomId || !equipmentId || !mongoose.Types.ObjectId.isValid(roomId)) {
      throwHttp(400, "Danh sách thiết bị không hợp lệ");
    }
    if (!mongoose.Types.ObjectId.isValid(equipmentId)) {
      throwHttp(400, "Danh sách thiết bị không hợp lệ");
    }
    const key = `${roomId}_${equipmentId}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({ roomId, equipmentId });
  }

  if (normalized.length === 0) {
    throwHttp(400, "Danh sách thiết bị không hợp lệ");
  }

  const hotelId = hotel._id;
  const roomIds = [...new Set(normalized.map((n) => n.roomId))].map((id) => new mongoose.Types.ObjectId(id));
  const rooms = await Room.find({ hotelId, _id: { $in: roomIds } }).select("+roomEquipment");
  const roomMap = new Map(rooms.map((r) => [r._id.toString(), r]));

  const rows = [];
  for (const { roomId, equipmentId } of normalized) {
    const room = roomMap.get(roomId);
    if (!room) {
      throwHttp(400, "Có phòng không thuộc khách sạn này");
    }
    const item = room.roomEquipment.id(equipmentId);
    if (!item || item.status !== "broken") {
      throwHttp(400, "Chỉ có thể gửi thiết bị đang ở trạng thái Hỏng");
    }
    rows.push({
      roomNumber: room.roomNumber,
      name: item.name,
    });
  }

  const ok = await sendMaintenanceRepairRequestEmail(to, {
    hotelName: hotel.name || "",
    hotelAddress: hotel.address,
    requesterName: requesterName ? String(requesterName).trim() : "",
    requesterRole,
    rows,
  });

  if (!ok) {
    throwHttp(502, "Không gửi được email. Kiểm tra cấu hình SMTP trên máy chủ.");
  }

  return { count: rows.length };
}

async function postOwnerEquipmentRepairRequest(hotelId, ownerUserId, ownerName, items) {
  const hotel = await Hotel.findOne({ _id: hotelId, ownerId: ownerUserId });
  if (!hotel) {
    throwHttp(404, "Không tìm thấy khách sạn hoặc bạn không có quyền truy cập");
  }
  return sendEquipmentRepairRequestForHotel(hotel, ownerName, items);
}

async function postStaffEquipmentRepairRequest(staffUserId, staffName, items) {
  const hotel = await findHotelByStaffId(staffUserId);
  if (!hotel) {
    throwHttp(403, "Tài khoản nhân viên chưa được gán khách sạn");
  }
  return sendEquipmentRepairRequestForHotel(hotel, staffName, items, "staff");
}

module.exports = {
  EQUIPMENT_STATUSES,
  EQUIPMENT_NAME_MAX,
  getOwnerRoomEquipmentForHotel,
  getStaffRoomEquipmentForHotel,
  postOwnerRoomEquipment,
  patchOwnerRoomEquipment,
  deleteOwnerRoomEquipment,
  postStaffRoomEquipment,
  patchStaffRoomEquipment,
  deleteStaffRoomEquipment,
  postOwnerEquipmentRepairRequest,
  postStaffEquipmentRepairRequest,
};
