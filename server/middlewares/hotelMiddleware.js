const Hotel = require("../models/Hotel");
const Room = require("../models/Room");

// Middleware để kiểm tra nếu người dùng là chủ sở hữu của khách sạn hoặc là admin
exports.verifyOwnerOrAdmin = async (req, res, next) => {
  try {
    // Lấy ID khách sạn từ params
    const hotelId = req.params.id || req.params.hotelId;
    
    if (!hotelId) {
      return res.status(400).json({ message: "ID khách sạn không được cung cấp" });
    }

    // Admin có tất cả quyền
    if (req.user.role === "admin") {
      return next();
    }

    // Tìm khách sạn
    const hotel = await Hotel.findById(hotelId);
    
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }    // Kiểm tra nếu người dùng là chủ sở hữu (staff)
    if (hotel.ownerId.toString() === req.user.id) {
      // Lưu thông tin khách sạn vào request để sử dụng sau này nếu cần
      req.hotel = hotel;
      return next();
    }

    return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Middleware chỉ dành cho admin
exports.verifyAdmin = (req, res, next) => {
  if (req.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Chỉ Admin mới có quyền thực hiện hành động này" });
};

// Middleware để kiểm tra nếu người dùng là chủ sở hữu của phòng hoặc là admin
exports.verifyRoomOwnerOrAdmin = async (req, res, next) => {
  try {
    const { id } = req.params; // ID của phòng
    
    if (!id) {
      return res.status(400).json({ message: "ID phòng không được cung cấp" });
    }

    // Admin có tất cả quyền
    if (req.user.role === "admin") {
      return next();
    }

    // Tìm phòng
    const room = await Room.findById(id);
    
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }    // Lấy thông tin khách sạn
    const hotel = await Hotel.findById(room.hotelId);
    
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn của phòng này" });
    }

    // Kiểm tra nếu người dùng là chủ sở hữu khách sạn (staff)
    if (hotel.ownerId.toString() === req.user.id) {
      // Lưu thông tin phòng và khách sạn vào request để sử dụng sau này nếu cần
      req.room = room;
      req.hotel = hotel;
      return next();
    }

    return res.status(403).json({ message: "Bạn không có quyền thực hiện hành động này" });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
}; 