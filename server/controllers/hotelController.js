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
      const hotels = await Hotel.find(query).select("-ownerId");
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
    // Chỉ admin mới được tạo hotel
    if (req.user.role !== "admin") {
      return res.status(403).json({ 
        message: "Chỉ Admin mới có quyền tạo khách sạn" 
      });
    }

    // Đã được validation qua middleware hotelValidation
    console.log("Đang tạo khách sạn mới với dữ liệu:", JSON.stringify(req.body));
    
    // Validate ownerId được cung cấp
    if (!req.body.ownerId) {
      return res.status(400).json({ 
        message: "Phải chỉ định ownerId cho khách sạn" 
      });
    }

    // Kiểm tra user có tồn tại và có role = "owner"
    const ownerUser = await User.findById(req.body.ownerId);
    if (!ownerUser) {
      return res.status(404).json({ 
        message: "Không tìm thấy user với ID đã cung cấp" 
      });
    }

    if (ownerUser.role !== "owner") {
      return res.status(400).json({ 
        message: "User được chỉ định phải có role là 'owner'" 
      });
    }

    // Validate address structure
    if (!req.body.address || !req.body.address.street || !req.body.address.city || !req.body.address.state || !req.body.address.zipCode) {
      return res.status(400).json({ 
        message: "Address phải có đầy đủ: street, city, state, zipCode" 
      });
    }

    // Validate contactInfo structure
    if (!req.body.contactInfo || !req.body.contactInfo.phone || !req.body.contactInfo.email) {
      return res.status(400).json({ 
        message: "ContactInfo phải có đầy đủ: phone, email" 
      });
    }

    const newHotel = new Hotel({
      name: req.body.name,
      ownerId: req.body.ownerId,
      description: req.body.description,
      address: req.body.address,
      contactInfo: req.body.contactInfo,
      starRating: req.body.starRating,
      policies: req.body.policies,
      images: req.body.images,
      status: req.body.status || 'active'
    });
    
    const savedHotel = await newHotel.save();
    console.log("Đã tạo khách sạn thành công:", savedHotel._id);
    console.log("Owner được chỉ định:", ownerUser.name, `(${ownerUser.email})`);
    
    res.status(201).json(savedHotel);
  } catch (error) {
    console.error("Lỗi khi tạo khách sạn:", error);
    res.status(500).json({ message: "Lỗi khi tạo khách sạn", error: error.message });
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