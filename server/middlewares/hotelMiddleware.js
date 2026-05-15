const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const { staffCanAccessHotel, findHotelByStaffId } = require("../utils/staffHotel");

// Middleware để kiểm tra nếu người dùng là chủ sở hữu của khách sạn hoặc là admin
exports.verifyOwnerOrAdmin = async (req, res, next) => {
  try {
    const hotelId = req.params.id || req.params.hotelId;

    if (!hotelId) {
      return res.status(400).json({ message: "ID khách sạn không được cung cấp" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    const hotel = await Hotel.findById(hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    if (hotel.ownerId.toString() === req.user.id) {
      req.hotel = hotel;
      return next();
    }

    if (req.user.role === "staff") {
      if (await staffCanAccessHotel(req.user.id, hotelId)) {
        req.hotel = hotel;
        req.staffHotelId = hotel._id;
        return next();
      }
    }

    return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.verifyAdmin = (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Chỉ Admin mới có quyền thực hiện hành động này" });
};

/** Gắn khách sạn cố định của staff vào request (dùng cho route /api/staff/*) */
exports.attachStaffHotel = async (req, res, next) => {
  try {
    if (req.user.role !== "staff") {
      return next();
    }

    const hotel = await findHotelByStaffId(req.user.id);

    if (!hotel) {
      return res.status(403).json({
        message: "Tài khoản nhân viên chưa được gán khách sạn",
      });
    }

    req.staffHotelId = hotel._id;
    req.hotel = hotel;
    next();
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

exports.verifyRoomOwnerOrAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "ID phòng không được cung cấp" });
    }

    if (req.user.role === "admin") {
      return next();
    }

    const room = await Room.findById(id);

    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    const hotel = await Hotel.findById(room.hotelId);

    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn của phòng này" });
    }

    if (hotel.ownerId.toString() === req.user.id) {
      req.room = room;
      req.hotel = hotel;
      return next();
    }

    if (req.user.role === "staff") {
      if (await staffCanAccessHotel(req.user.id, hotel._id)) {
        req.room = room;
        req.hotel = hotel;
        req.staffHotelId = hotel._id;
        return next();
      }
    }

    return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
