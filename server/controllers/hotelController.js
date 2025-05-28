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
    res.status(500).json({ message: "Lỗi khi lấy thông tin khách sạn", error: error.message });
  }
};

// Get hotels by owner
exports.getHotelsByOwner = async (req, res) => {
  try {
    const hotels = await Hotel.find({ owner: req.user.id });
    res.status(200).json(hotels);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy danh sách khách sạn của bạn", error: error.message });
  }
};

// Create new hotel (admin only)
exports.createHotel = async (req, res) => {
  try {
    const {
      name,
      description,
      address,
      images,
      starRating,
      contactInfo,
      policies
    } = req.body;

    const newHotel = new Hotel({
      name,
      description,
      address,
      images,
      starRating,
      contactInfo,
      policies,
      owner: req.user.id // Assuming req.user is set by auth middleware
    });

    const savedHotel = await newHotel.save();
    res.status(201).json(savedHotel);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi tạo khách sạn", error: error.message });
  }
};

// Update hotel (admin or owner only)
exports.updateHotel = async (req, res) => {
  try {
    // Không cần kiểm tra quyền sở hữu vì đã có middleware verifyOwner

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );
    
    res.status(200).json(updatedHotel);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi cập nhật khách sạn", error: error.message });
  }
};

// Delete hotel (admin or owner only)
exports.deleteHotel = async (req, res) => {
  try {
    // Không cần kiểm tra quyền sở hữu vì đã có middleware verifyOwner
    
    await Hotel.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Đã xóa khách sạn thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi xóa khách sạn", error: error.message });
  }
}; 