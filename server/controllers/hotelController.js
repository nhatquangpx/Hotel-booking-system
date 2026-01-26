const Hotel = require("../models/Hotel");
const User = require("../models/User");
const { hasCloudinaryConfig } = require("../config/multerConfig");
const { 
  notifyAdminHotelRegistrationRequest,
  notifyAdminHotelApproved,
  notifyAdminHotelRejected,
  notifyAdminHotelSuspended
} = require("../services/notifications");

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

// Create new hotel
exports.createHotel = async (req, res) => {
  try {
    console.log("Dữ liệu khách sạn:", req.body);
    console.log("Files:", req.files);

    // Lấy đường dẫn ảnh từ req.files
    // Nếu dùng Cloudinary: file.secure_url hoặc file.url sẽ chứa URL đầy đủ
    // Nếu dùng local: file.filename sẽ chứa tên file, cần thêm /uploads/hotels/
    const images = req.files ? req.files.map(file => {
      if (hasCloudinaryConfig) {
        // Cloudinary trả về URL đầy đủ trong file.secure_url (HTTPS) hoặc file.url (HTTP)
        return file.secure_url || file.url || file.path;
      } else {
        // Local storage: tạo đường dẫn tương đối
        return `/uploads/hotels/${file.filename}`;
      }
    }) : [];

    const newHotel = new Hotel({
      ...req.body,
      images: images
    });

    const savedHotel = await newHotel.save();
    console.log(`Đã tạo khách sạn thành công: ${savedHotel._id} (${savedHotel.name}) bởi owner ${savedHotel.ownerId}`);
    
    // Notify admins about new hotel registration request
    // Note: If hotel status is 'pending', it needs approval
    if (savedHotel.status === 'pending' || !savedHotel.status) {
      notifyAdminHotelRegistrationRequest(savedHotel._id).catch(err => {
        console.error('Lỗi khi tạo thông báo yêu cầu đăng ký khách sạn cho admin:', err);
      });
    }
    
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
    console.log("Files:", req.files);

    // Không cho phép thay đổi trường ownerId
    if (req.body.ownerId) {
      delete req.body.ownerId;
    }

    // Parse nested fields từ FormData (address[number], contactInfo[phone], etc.)
    const updateData = {};
    
    // Copy các fields đơn giản
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.starRating) updateData.starRating = parseInt(req.body.starRating);
    if (req.body.status) updateData.status = req.body.status;

    // Parse address
    if (req.body['address[number]'] || req.body['address[street]'] || req.body['address[city]']) {
      updateData.address = {
        number: req.body['address[number]'] || req.body.address?.number || '',
        street: req.body['address[street]'] || req.body.address?.street || '',
        city: req.body['address[city]'] || req.body.address?.city || ''
      };
    } else if (req.body.address && typeof req.body.address === 'object') {
      updateData.address = req.body.address;
    }

    // Parse contactInfo
    if (req.body['contactInfo[phone]'] || req.body['contactInfo[email]']) {
      updateData.contactInfo = {
        phone: req.body['contactInfo[phone]'] || req.body.contactInfo?.phone || '',
        email: req.body['contactInfo[email]'] || req.body.contactInfo?.email || ''
      };
    } else if (req.body.contactInfo && typeof req.body.contactInfo === 'object') {
      updateData.contactInfo = req.body.contactInfo;
    }

    // Parse policies
    if (req.body['policies[checkInTime]'] || req.body['policies[checkOutTime]']) {
      updateData.policies = {
        checkInTime: req.body['policies[checkInTime]'] || req.body.policies?.checkInTime || '14:00',
        checkOutTime: req.body['policies[checkOutTime]'] || req.body.policies?.checkOutTime || '12:00'
      };
    } else if (req.body.policies && typeof req.body.policies === 'object') {
      updateData.policies = req.body.policies;
    }

    // Parse existingImages nếu là string (từ FormData)
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
        return `/uploads/hotels/${file.filename}`;
      }
    }) : [];

    // Gộp ảnh cũ và mới (ưu tiên existingImages nếu có, nếu không có ảnh mới thì giữ nguyên ảnh cũ)
    if (existingImages.length > 0 || newImages.length > 0) {
      updateData.images = [...existingImages, ...newImages];
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    console.log(`Đã cập nhật khách sạn thành công: ${req.params.id} (${updatedHotel?.name})`);
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
    console.log(`Đang xóa khách sạn với ID: ${req.params.id}`);
    
    const deletedHotel = await Hotel.findByIdAndDelete(req.params.id);
    if (deletedHotel) {
      console.log(`Đã xóa khách sạn thành công: ${req.params.id} (${deletedHotel.name})`);
    }
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

// Get featured hotels (5-star hotels)
exports.getFeaturedHotels = async (req, res) => {
  try {
    const featuredHotels = await Hotel.find({ 
      starRating: 5,
      status: "active" 
    })
    .populate({
      path: 'ownerId',
      select: 'name email phone -_id'
    })
    .limit(6); // Giới hạn 6 khách sạn nổi bật
    
    res.status(200).json(featuredHotels);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách khách sạn nổi bật:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy danh sách khách sạn nổi bật", 
      error: error.message 
    });
  }
};

// Get hotels by filter
exports.getHotelByFilter = async (req, res) => {
  try {
    const { city, starRating, name, search } = req.query;
    let query = {};

    // Apply filters if they exist
    if (city) {
      query["address.city"] = { $regex: city, $options: "i" };
    }
    
    if (starRating) {
      query.starRating = parseInt(starRating);
    }

    if (name) {
      query.name = { $regex: name, $options: "i" };
    }

    // Tìm kiếm đồng thời theo tên khách sạn và địa danh
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } }
      ];
    }
    
    const hotels = await Hotel.find(query)
      .populate({
        path: 'ownerId',
        select: 'name email phone -_id'
      });
      
    res.status(200).json(hotels);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách khách sạn theo bộ lọc:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy danh sách khách sạn theo bộ lọc", 
      error: error.message 
    });
  }
};