const Hotel = require("../models/Hotel");

// Get all hotels
exports.getAllHotels = async (req, res) => {
  try {
    const { city, minPrice, maxPrice, starRating } = req.query;
    let query = {};

    // Apply filters if they exist
    if (city) {
      query["address.city"] = { $regex: city, $options: "i" };
    }
    
    if (starRating) {
      query.starRating = starRating;
    }
    
    const hotels = await Hotel.find(query).select("-owner");
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
      path: "owner",
      select: "fullName email phone -_id"
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
    const hotels = await Hotel.find({ owner: req.user.id });
    res.status(200).json(hotels);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách khách sạn của bạn:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách khách sạn của bạn", error: error.message });
  }
};

// Create new hotel (admin only)
exports.createHotel = async (req, res) => {
  try {
    // Đã được validation qua middleware hotelValidation
    console.log("Đang tạo khách sạn mới với dữ liệu:", JSON.stringify(req.body));
    
    // Đảm bảo rằng owner là người tạo (hoặc có thể chỉ định owner nếu là admin)
    if (!req.body.owner) {
      req.body.owner = req.user.id;
    }

    const newHotel = new Hotel({
      name: req.body.name,
      owner: req.body.owner,
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
    console.log("Dữ liệu cập nhật:", JSON.stringify(req.body));

    // Không cho phép thay đổi trường owner
    if (req.body.owner) {
      delete req.body.owner;
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