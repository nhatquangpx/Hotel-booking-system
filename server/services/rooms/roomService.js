const Room = require("../../models/Room");
const BookingHistory = require("../../models/Booking");

/** @param {unknown[]} [files] multer file list */
function mapRoomImageUrls(files, hasCloudinary) {
  if (!files || !files.length) return [];
  return files.map((file) => {
    if (hasCloudinary) {
      return file.secure_url || file.url || file.path;
    }
    return `/uploads/rooms/${file.filename}`;
  });
}

function throwHttp(statusCode, message) {
  const e = new Error(message);
  e.statusCode = statusCode;
  throw e;
}

/**
 * @param {string} hotelId
 * @param {{ checkInDate?: string, checkOutDate?: string }} query
 */
async function listRoomsByHotel(hotelId, query = {}) {
  const { checkInDate, checkOutDate } = query;
  const rooms = await Room.find({ hotelId });

  if (checkInDate && checkOutDate) {
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);

    const bookings = await BookingHistory.find({
      room: { $in: rooms.map((room) => room._id) },
      /** Nửa khoảng [checkIn, checkOut) giống checkRoomAvailability: checkout = ngày trả phòng, không trùng đêm với nhận cùng ngày */
      checkInDate: { $lt: endDate },
      checkOutDate: { $gt: startDate },
      paymentStatus: { $in: ["pending", "paid"] },
    });

    const bookedRoomIds = bookings.map((booking) => booking.room.toString());
    return rooms.filter(
      (room) => !bookedRoomIds.includes(room._id.toString()) && room.roomStatus === "active"
    );
  }

  return rooms;
}

async function getRoomById(roomId) {
  return Room.findById(roomId).populate({
    path: "hotelId",
    select: "address starRating images",
  });
}

const VALID_ROOM_TYPES = ["standard", "deluxe", "suite", "family", "executive"];

/**
 * @param {object} params
 * @param {string} params.hotelId
 * @param {string} params.roomNumber
 * @param {string} params.type
 * @param {unknown} params.price
 * @param {unknown} params.maxPeople
 * @param {string} params.description
 * @param {unknown} params.facilities
 * @param {string} [params.roomStatus]
 * @param {unknown[]} [params.files] multer uploads
 * @param {boolean} params.hasCloudinary
 */
async function createRoom(params) {
  const {
    hotelId,
    roomNumber,
    type,
    price,
    maxPeople,
    description,
    facilities,
    roomStatus,
    files,
    hasCloudinary,
  } = params;

  if (!VALID_ROOM_TYPES.includes(type)) {
    throwHttp(
      400,
      `Loại phòng không hợp lệ. Loại phòng phải là một trong: ${VALID_ROOM_TYPES.join(", ")}`
    );
  }

  const priceNumber = Number(price);
  if (Number.isNaN(priceNumber) || priceNumber <= 0) {
    throwHttp(400, "Giá phòng phải là một số dương hợp lệ");
  }

  let parsedFacilities = facilities;
  if (typeof facilities === "string") {
    try {
      parsedFacilities = JSON.parse(facilities);
    } catch {
      parsedFacilities = [];
    }
  }

  const existingRoom = await Room.findOne({ hotelId, roomNumber });
  if (existingRoom) {
    throwHttp(400, "Số phòng này đã tồn tại trong khách sạn");
  }

  const facilityList = Array.isArray(parsedFacilities) ? parsedFacilities : [];
  const images = mapRoomImageUrls(files, hasCloudinary);

  const newRoom = new Room({
    hotelId,
    roomNumber,
    type,
    description,
    price: {
      regular: priceNumber,
      discount: 0,
    },
    maxPeople: Number(maxPeople),
    facilities: facilityList,
    roomEquipment: [],
    images,
    roomStatus: roomStatus || "active",
    bookingStatus: "empty",
  });

  return newRoom.save();
}

/**
 * @param {string} roomId
 * @param {object} reqBody — req.body (có thể bị chỉnh trong hàm: copy nội bộ)
 * @param {unknown[]} [files] multer uploads
 * @param {boolean} hasCloudinary
 */
async function updateRoom(roomId, reqBody, files, hasCloudinary) {
  const body = { ...reqBody };

  if (typeof body.price === "string") {
    try {
      body.price = JSON.parse(body.price);
    } catch {
      body.price = { regular: 0, discount: 0 };
    }
  }

  if (typeof body.facilities === "string") {
    try {
      body.facilities = JSON.parse(body.facilities);
    } catch {
      body.facilities = [];
    }
  }

  let existingImages = [];
  if (body.existingImages) {
    try {
      existingImages = JSON.parse(body.existingImages);
    } catch {
      existingImages = [];
    }
  }

  const newImages = mapRoomImageUrls(files, hasCloudinary);
  body.images = [...existingImages, ...newImages];

  const room = await Room.findById(roomId);
  if (!room) {
    throwHttp(404, "Không tìm thấy phòng");
  }

  if (body.roomStatus && room.bookingStatus !== "empty") {
    throwHttp(400, "Chỉ có thể thay đổi trạng thái phòng khi phòng đang trống (empty)");
  }

  if (body.bookingStatus) {
    delete body.bookingStatus;
  }

  if (body.roomEquipment !== undefined) {
    delete body.roomEquipment;
  }

  return Room.findByIdAndUpdate(roomId, { $set: body }, { new: true, runValidators: true });
}

/** Chỉ đổi roomStatus khi bookingStatus === empty (owner/staff). */
async function updateRoomStatusOnly(roomId, roomStatus) {
  const valid = ["active", "maintenance", "inactive"];
  if (!valid.includes(roomStatus)) {
    throwHttp(400, "Trạng thái phòng không hợp lệ");
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throwHttp(404, "Không tìm thấy phòng");
  }

  if (room.bookingStatus !== "empty") {
    throwHttp(400, "Chỉ có thể thay đổi trạng thái phòng khi phòng đang trống (empty)");
  }

  return Room.findByIdAndUpdate(
    roomId,
    { $set: { roomStatus } },
    { new: true, runValidators: true }
  );
}

async function deleteRoom(roomId) {
  const room = await Room.findById(roomId);
  if (!room) {
    throwHttp(404, "Không tìm thấy phòng");
  }

  const activeBookings = await BookingHistory.countDocuments({
    room: roomId,
    paymentStatus: { $in: ["pending", "paid"] },
    checkOutDate: { $gte: new Date() },
  });

  if (activeBookings > 0) {
    throwHttp(400, "Không thể xóa phòng đang có đặt chỗ");
  }

  await Room.findByIdAndDelete(roomId);
}

module.exports = {
  listRoomsByHotel,
  getRoomById,
  createRoom,
  updateRoom,
  updateRoomStatusOnly,
  deleteRoom,
  VALID_ROOM_TYPES,
};
