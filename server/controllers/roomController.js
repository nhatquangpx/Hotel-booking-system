const Room = require("../models/Room");
const Hotel = require("../models/Hotel");
const BookingHistory = require("../models/Booking");

// Get all rooms for a specific hotel
exports.getRoomsByHotel = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const { checkInDate, checkOutDate } = req.query;
    
    console.log(`Lấy danh sách phòng cho khách sạn ID: ${hotelId}`);
    if (checkInDate && checkOutDate) {
      console.log(`Kiểm tra phòng trống từ ${checkInDate} đến ${checkOutDate}`);
    }
    
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
      
      console.log(`Tìm thấy ${availableRooms.length} phòng trống trong khoảng thời gian yêu cầu`);
      return res.status(200).json(availableRooms);
    }
    
    console.log(`Tìm thấy ${rooms.length} phòng cho khách sạn này`);
    res.status(200).json(rooms);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách phòng:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách phòng", error: error.message });
  }
};

// Get room by ID
exports.getRoomById = async (req, res) => {
  try {
    console.log(`Lấy thông tin phòng ID: ${req.params.id}`);
    
    const room = await Room.findById(req.params.id).populate({
      path: "hotel",
      select: "name address starRating images"
    });
    
    if (!room) {
      console.log(`Không tìm thấy phòng với ID: ${req.params.id}`);
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    
    console.log(`Đã tìm thấy phòng: ${room.name} thuộc khách sạn: ${room.hotel.name}`);
    res.status(200).json(room);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin phòng:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin phòng", error: error.message });
  }
};

// Create new room (admin/staff/owner)
exports.createRoom = async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    // Đã được validation qua middleware roomValidation
    console.log(`Đang tạo phòng mới cho khách sạn ID: ${hotelId}`);
    console.log("Dữ liệu phòng:", JSON.stringify(req.body));
    
    const newRoom = new Room({
      hotel: hotelId,
      name: req.body.name,
      type: req.body.type,
      description: req.body.description,
      price: req.body.price,
      images: req.body.images,
      status: req.body.status || 'available'
    });
    
    const savedRoom = await newRoom.save();
    console.log(`Đã tạo phòng thành công, ID: ${savedRoom._id}`);
    res.status(201).json(savedRoom);
  } catch (error) {
    console.error("Lỗi khi tạo phòng mới:", error);
    res.status(500).json({ message: "Lỗi khi tạo phòng mới", error: error.message });
  }
};

// Update room (admin/staff/owner)
exports.updateRoom = async (req, res) => {
  try {
    console.log(`Đang cập nhật phòng ID: ${req.params.id}`);
    console.log("Dữ liệu cập nhật:", JSON.stringify(req.body));
    
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      console.log(`Không tìm thấy phòng với ID: ${req.params.id}`);
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    
    // Không cần kiểm tra quyền sở hữu vì đã có middleware verifyOwner cho khách sạn
    
    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    console.log(`Đã cập nhật phòng thành công: ${updatedRoom.name}`);
    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error("Lỗi khi cập nhật phòng:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật phòng", error: error.message });
  }
};

// Delete room (admin/staff/owner)
exports.deleteRoom = async (req, res) => {
  try {
    console.log(`Đang xóa phòng ID: ${req.params.id}`);
    
    const room = await Room.findById(req.params.id);
    
    if (!room) {
      console.log(`Không tìm thấy phòng với ID: ${req.params.id}`);
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    
    // Check if room has active bookings
    const activeBookings = await BookingHistory.countDocuments({
      room: req.params.id,
      paymentStatus: { $in: ["pending", "paid"] },
      checkOutDate: { $gte: new Date() }
    });
    
    if (activeBookings > 0) {
      console.log(`Không thể xóa phòng ID: ${req.params.id} vì đang có ${activeBookings} đặt chỗ`);
      return res.status(400).json({ message: "Không thể xóa phòng đang có đặt chỗ" });
    }
    
    await Room.findByIdAndDelete(req.params.id);
    console.log(`Đã xóa phòng thành công ID: ${req.params.id}`);
    res.status(200).json({ message: "Đã xóa phòng thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa phòng:", error);
    res.status(500).json({ message: "Lỗi khi xóa phòng", error: error.message });
  }
}; 