const Hotel = require("../models/Hotel");
const User = require("../models/User");

// Get all hotels
exports.getAllHotels = async (req, res) => {
  try {
    const { city, starRating } = req.query;
    let query = {};

    // Apply filters if they exist
    if (city) {
      query["address.city"] = { $regex: city, $options: "i" };
    }
    
    if (starRating) {
      query.starRating = starRating;
    }
    
    const hotels = await Hotel.find(query)
      .populate({
        path: 'ownerId',
        select: 'name email phone -_id'
      });
      
    res.status(200).json(hotels);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách khách sạn:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách khách sạn", error: error.message });
  }
};

// Get hotel by ID
exports.getHotelById = async (req, res) => {
  try {
    const hotel = await Hotel.findById(req.params.id).populate({
      path: "ownerId",
      select: "name email phone -_id"
    }); 
    
    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }
    
    res.status(200).json(hotel);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin khách sạn:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin khách sạn", error: error.message });
  }
};

// Get hotels by owner
exports.getHotelsByOwner = async (req, res) => {
  try {
    const hotels = await Hotel.find({ ownerId: req.user.id });
    res.status(200).json(hotels);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách khách sạn của bạn:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách khách sạn của bạn", error: error.message });
  }
};

// Create new hotel (admin only)
exports.createHotel = async (req, res) => {
  try {
    const { name, description, starRating, ownerId, status, address, contactInfo } = req.body;
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      imageUrls = req.files.map(file => `/uploads/hotels/${file.filename}`);
    }

    const newHotel = new Hotel({
      name,
      description,
      starRating,
      ownerId,
      status,
      address,
      contactInfo,
      images: imageUrls
    });

    await newHotel.save();
    res.status(201).json({ message: 'Khách sạn đã được tạo thành công!', hotel: newHotel });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// Update hotel (admin or owner only)
exports.updateHotel = async (req, res) => {
  try {
    // Đã được validation qua middleware hotelValidation
    console.log("Đang cập nhật khách sạn với ID:", req.params.id);
    console.log("Dữ liệu cập nhật:", JSON.stringify(req.body));    // Không cho phép thay đổi trường ownerId
    if (req.body.ownerId) {
      delete req.body.ownerId;
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    
    console.log("Đã cập nhật khách sạn thành công");
    res.status(200).json(updatedHotel);
  } catch (error) {
    console.error("Lỗi khi cập nhật khách sạn:", error);
    res.status(500).json({ message: "Lỗi khi cập nhật khách sạn", error: error.message });
  }
};

// Delete hotel (admin or owner only)
exports.deleteHotel = async (req, res) => {
  try {
    // Không cần kiểm tra quyền sở hữu vì đã có middleware verifyOwner
    console.log("Đang xóa khách sạn với ID:", req.params.id);
    
    await Hotel.findByIdAndDelete(req.params.id);
    console.log("Đã xóa khách sạn thành công");
    res.status(200).json({ message: "Đã xóa khách sạn thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa khách sạn:", error);
    res.status(500).json({ message: "Lỗi khi xóa khách sạn", error: error.message });
  }
};

// Get all users with role "owner" (admin only)
exports.getAllOwners = async (req, res) => {
  try {
    // Chỉ admin mới được xem danh sách owners
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        message: "Chỉ Admin mới có quyền xem danh sách owners" 
      });
    }

    const owners = await User.find({ role: "owner" }).select("name email phone _id");
    console.log(`Tìm thấy ${owners.length} owners`);
    
    res.status(200).json(owners);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách owners:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách owners", error: error.message });
  }
};