const Room = require("../models/Room");
const Hotel = require("../models/Hotel");
const BookingHistory = require("../models/Booking");
const { hasCloudinaryConfig } = require("../config/multerConfig");

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
    let query = { hotelId: hotelId };
    
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
      
      // Filter out booked rooms and rooms that are not operational
      const bookedRoomIds = bookings.map(booking => booking.room.toString());
      const availableRooms = rooms.filter(room => 
        !bookedRoomIds.includes(room._id.toString()) && 
        room.bookingStatus === "empty" &&
        room.roomStatus === "active"
      );
      
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
      path: "hotelId",
      select: "address starRating images"
    });
    
    if (!room) {
      console.log(`Không tìm thấy phòng với ID: ${req.params.id}`);
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }
    
    console.log(`Đã tìm thấy phòng thuộc khách sạn: ${room.hotelId? room.hotelId._id : ''}`);
    res.status(200).json(room);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin phòng:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin phòng", error: error.message });
  }
};

// Create new room (admin/owner)
exports.createRoom = async (req, res) => {
  try {
    console.log("Dữ liệu phòng:", req.body);
    console.log("Files:", req.files);

    // Lấy đường dẫn ảnh từ req.files
    // Nếu dùng Cloudinary: file.secure_url hoặc file.url sẽ chứa URL đầy đủ
    // Nếu dùng local: file.filename sẽ chứa tên file, cần thêm /uploads/rooms/
    const images = req.files ? req.files.map(file => {
      if (hasCloudinaryConfig) {
        // Cloudinary trả về URL đầy đủ trong file.secure_url (HTTPS) hoặc file.url (HTTP)
        return file.secure_url || file.url || file.path;
      } else {
        // Local storage: tạo đường dẫn tương đối
        return `/uploads/rooms/${file.filename}`;
      }
    }) : [];

    const { hotelId, roomNumber, type, price, maxPeople, description, facilities } = req.body;
    
    // Validate type enum
    const validTypes = ['standard', 'deluxe', 'suite', 'family', 'executive'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ 
        message: `Loại phòng không hợp lệ. Loại phòng phải là một trong: ${validTypes.join(', ')}` 
      });
    }

    // Validate price
    const priceNumber = Number(price);
    if (isNaN(priceNumber) || priceNumber <= 0) {
      return res.status(400).json({ 
        message: "Giá phòng phải là một số dương hợp lệ"
      });
    }

    // Parse facilities từ JSON string nếu cần
    let parsedFacilities = facilities;
    if (typeof facilities === 'string') {
      try {
        parsedFacilities = JSON.parse(facilities);
      } catch (e) {
        parsedFacilities = [];
      }
    }

    // Kiểm tra số phòng đã tồn tại trong khách sạn chưa
    const existingRoom = await Room.findOne({ 
      hotelId: hotelId,
      roomNumber: roomNumber 
    });

    if (existingRoom) {
      return res.status(400).json({
        message: "Số phòng này đã tồn tại trong khách sạn"
      });
    }
    
    const newRoom = new Room({
      hotelId,
      roomNumber,
      type,
      description,
      price: { 
        regular: priceNumber,
        discount: 0 
      },
      maxPeople: Number(maxPeople),
      facilities: parsedFacilities,
      images: images,
      roomStatus: req.body.roomStatus || 'active',
      bookingStatus: 'empty'
    });
    
    const savedRoom = await newRoom.save();
    console.log("Đã tạo phòng thành công:", savedRoom);
    res.status(201).json(savedRoom);
  } catch (error) {
    console.error("Lỗi khi tạo phòng:", error);
    res.status(500).json({ message: "Lỗi khi tạo phòng", error: error.message });
  }
};

// Update room (admin/owner)
exports.updateRoom = async (req, res) => {
  try {
    console.log(`Đang cập nhật phòng ID: ${req.params.id}`);
    console.log("Dữ liệu cập nhật:", JSON.stringify(req.body));

    // Parse price nếu là string (từ FormData)
    if (typeof req.body.price === 'string') {
      try {
        req.body.price = JSON.parse(req.body.price);
      } catch (e) {
        req.body.price = { regular: 0, discount: 0 };
      }
    }

    // Parse facilities nếu là string
    if (typeof req.body.facilities === 'string') {
      try {
        req.body.facilities = JSON.parse(req.body.facilities);
      } catch (e) {
        req.body.facilities = [];
      }
    }

    // Parse existingImages nếu là string
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        existingImages = JSON.parse(req.body.existingImages);
      } catch (e) {
        existingImages = [];
      }
    }

    // Lấy đường dẫn ảnh mới từ req.files
    const newImages = req.files ? req.files.map(file => {
      if (hasCloudinaryConfig) {
        // Cloudinary trả về URL đầy đủ trong file.secure_url (HTTPS) hoặc file.url (HTTP)
        return file.secure_url || file.url || file.path;
      } else {
        // Local storage: tạo đường dẫn tương đối
        return `/uploads/rooms/${file.filename}`;
      }
    }) : [];

    // Gộp ảnh cũ và mới
    req.body.images = [...existingImages, ...newImages];

    const room = await Room.findById(req.params.id);

    if (!room) {
      console.log(`Không tìm thấy phòng với ID: ${req.params.id}`);
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    // Kiểm tra nếu đang cập nhật roomStatus: chỉ cho phép khi bookingStatus là 'empty'
    if (req.body.roomStatus && room.bookingStatus !== 'empty') {
      return res.status(400).json({ 
        message: "Chỉ có thể thay đổi trạng thái phòng khi phòng đang trống (empty)" 
      });
    }

    // Không cho phép cập nhật bookingStatus trực tiếp từ owner
    if (req.body.bookingStatus) {
      delete req.body.bookingStatus;
    }

    // Không cần kiểm tra quyền sở hữu vì đã có middleware verifyOwner cho khách sạn

    const updatedRoom = await Room.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    console.log(`Đã cập nhật phòng thành công: ${updatedRoom.roomNumber}`);
    res.status(200).json(updatedRoom);
  } catch (error) {
    console.error("Lỗi khi cập nhật phòng:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật phòng", error: error.message });
  }
};

// Delete room (admin/owner)
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