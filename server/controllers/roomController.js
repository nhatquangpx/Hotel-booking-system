const Room = require("../models/Room");
const Hotel = require("../models/Hotel");
const BookingHistory = require("../models/BookingHistory");

// Get all rooms for a specific hotel
exports.getRoomsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate } = req.query;
    
    // Base query to find rooms in the specified hotel
    let query = { hotel: hotelId };
    
    // Get all rooms in the hotel
    const rooms = await Room.find(query);
    
    // If dates are provided, check availability
    if (checkInDate && checkOutDate) {
      const startDate = new Date(checkInDate);
      const endDate = new Date(checkOutDate);
      
      // Get all bookings that overlap with the requested dates
      const bookings = await BookingHistory.find({
        room: { $in: rooms.map(room => room._id) },
        $or: [
          { 
            checkInDate: { $lte: endDate },
            checkOutDate: { $gte: startDate }
          }
        ],
        paymentStatus: { $in: ["pending", "paid"] }
      });
      
      // Filter out booked rooms
      const bookedRoomIds = bookings.map(booking => booking.room.toString());
      const availableRooms = rooms.filter(room => !bookedRoomIds.includes(room._id.toString()));
      
      return res.status(200).json(availableRooms);
    }
    
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách phòng", error: error.message });
  }
};

// Get room by ID
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate({
      path: "hotel",
      select: "name address starRating images"
    });
    
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    
    res.status(200).json(room);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin phòng", error: error.message });
  }
};

// Create new room (admin/staff/owner)
exports.createRoom = async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    // Hotel đã được kiểm tra trong middleware verifyOwner
    // Không cần kiểm tra lại quyền ở đây
    
    const newRoom = new Room({
      ...req.body,
      hotel: hotelId
    });
    
    const savedRoom = await newRoom.save();
    res.status(201).json(savedRoom);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo phòng mới", error: error.message });
  }
};

// Update room (admin/staff/owner)
exports.updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    
    // Không cần kiểm tra quyền sở hữu vì đã có middleware verifyOwner cho khách sạn
    
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.status(200).json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật phòng", error: error.message });
  }
};

// Delete room (admin/staff/owner)
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    
    // Không cần kiểm tra quyền sở hữu vì đã có middleware verifyOwner cho khách sạn
    
    // Check if room has active bookings
    const activeBookings = await BookingHistory.countDocuments({
      room: req.params.id,
      paymentStatus: { $in: ["pending", "paid"] },
      checkOutDate: { $gte: new Date() }
    });
    
    if (activeBookings > 0) {
      return res.status(400).json({ message: "Không thể xóa phòng đang có đặt chỗ" });
    }
    
    await Room.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Đã xóa phòng thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa phòng", error: error.message });
  }
}; 