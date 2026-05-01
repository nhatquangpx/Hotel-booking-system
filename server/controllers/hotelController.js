const Hotel = require("../models/Hotel");
const Room = require("../models/Room");
const User = require("../models/User");
const { hasCloudinaryConfig } = require("../config/multerConfig");
const mongoose = require("mongoose");
const { resolveEffectiveQrConfig } = require("../utils/paymentQrConfig");
const { isVnpayConfigComplete } = require("../utils/hotelPaymentConfig");

function isQrConfigComplete(qr) {
  return Boolean(
    String(qr?.accountName || "").trim() &&
      String(qr?.accountNumber || "").trim() &&
      String(qr?.bankName || "").trim() &&
      String(qr?.qrImageUrl || "").trim()
  );
}

function resolveQrTextFields(body = {}, fallback = {}) {
  const fromBracket = {
    accountName: body["paymentConfig[qr][accountName]"],
    accountNumber: body["paymentConfig[qr][accountNumber]"],
    bankName: body["paymentConfig[qr][bankName]"]
  };
  const fromObject = body.paymentConfig?.qr || {};

  return {
    accountName:
      fromBracket.accountName !== undefined
        ? fromBracket.accountName
        : fromObject.accountName !== undefined
          ? fromObject.accountName
          : fallback.accountName,
    accountNumber:
      fromBracket.accountNumber !== undefined
        ? fromBracket.accountNumber
        : fromObject.accountNumber !== undefined
          ? fromObject.accountNumber
          : fallback.accountNumber,
    bankName:
      fromBracket.bankName !== undefined
        ? fromBracket.bankName
        : fromObject.bankName !== undefined
          ? fromObject.bankName
          : fallback.bankName
  };
}

function resolveVnpayFields(body = {}, fallback = {}) {
  const fromBracket = {
    tmnCode: body["paymentConfig[vnpay][tmnCode]"],
    secureSecret: body["paymentConfig[vnpay][secureSecret]"]
  };
  const fromObject = body.paymentConfig?.vnpay || {};

  return {
    tmnCode:
      fromBracket.tmnCode !== undefined
        ? fromBracket.tmnCode
        : fromObject.tmnCode !== undefined
          ? fromObject.tmnCode
          : fallback.tmnCode,
    secureSecret:
      fromBracket.secureSecret !== undefined
        ? fromBracket.secureSecret
        : fromObject.secureSecret !== undefined
          ? fromObject.secureSecret
          : fallback.secureSecret
  };
}

/** VNPay trên JSON API: không trả secureSecret; client chỉ cần `isConfigured` + tmnCode. */
function shapeVnpayForApiResponse(vnpay) {
  if (!vnpay) return undefined;
  const plain = vnpay.toObject ? vnpay.toObject() : { ...vnpay };
  return {
    tmnCode: String(plain.tmnCode || "").trim(),
    isConfigured: isVnpayConfigComplete(plain)
  };
}

function sanitizeHotelPaymentConfigResponse(hotel, { guestBookingQr = false } = {}) {
  const plain = hotel.toObject ? hotel.toObject() : { ...hotel };
  if (!plain.paymentConfig) return plain;
  plain.paymentConfig = { ...plain.paymentConfig };
  if (guestBookingQr) {
    plain.paymentConfig.qr = resolveEffectiveQrConfig(plain.paymentConfig.qr || {});
  }
  if (plain.paymentConfig.vnpay) {
    plain.paymentConfig.vnpay = shapeVnpayForApiResponse(plain.paymentConfig.vnpay);
  }
  return plain;
}

function getHotelImageFiles(req) {
  if (!req.files) return [];
  if (Array.isArray(req.files)) return req.files;
  return req.files.images || [];
}

function getQrUploadFile(req) {
  if (!req.files || Array.isArray(req.files)) return null;
  const arr = req.files.qrCodeImage;
  return arr && arr[0] ? arr[0] : null;
}

function resolveHotelUploadedImageUrl(file) {
  if (!file) return "";
  if (hasCloudinaryConfig) {
    return file.secure_url || file.url || file.path || "";
  }
  if (file.fieldname === "qrCodeImage") {
    return `/uploads/hotel-qr/${file.filename}`;
  }
  return `/uploads/hotels/${file.filename}`;
}

function isGuestHotelByIdRequest(req) {
  return req.baseUrl === "/api/guest" && /^\/hotels\/[^/]+$/.test(req.path || "");
}

/** Trả về paymentConfig trên response: owner/admin luôn; guest chỉ khi đặt phòng (đã login + query). */
function shouldExposePaymentConfig(req) {
  if (req.baseUrl === "/api/owner" || req.baseUrl === "/api/admin") {
    return true;
  }
  if (isGuestHotelByIdRequest(req)) {
    return (
      req.query.forBooking === "true" &&
      req.user &&
      req.user.role === "guest"
    );
  }
  return false;
}

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
        path: "ownerId",
        select: "name email phone _id"
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
    let q = Hotel.findById(req.params.id);
    if (shouldExposePaymentConfig(req)) {
      q = q.select(Hotel.PAYMENT_CONFIG_SELECT);
    }
    q = q.populate({
      path: "ownerId",
      select: "name email phone _id"
    });
    const hotel = await q;

    if (!hotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }
    if (shouldExposePaymentConfig(req)) {
      const guestBookingQr =
        isGuestHotelByIdRequest(req) && req.query.forBooking === "true";
      return res.status(200).json(
        sanitizeHotelPaymentConfigResponse(hotel, { guestBookingQr })
      );
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
    const hotels = await Hotel.find({ ownerId: req.user.id }).select(Hotel.PAYMENT_CONFIG_SELECT);
    res.status(200).json(hotels.map((h) => sanitizeHotelPaymentConfigResponse(h)));
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

    const imageFiles = getHotelImageFiles(req);
    const images = imageFiles.map(resolveHotelUploadedImageUrl);
    const qrFile = getQrUploadFile(req);

    const createData = {};
    if (req.body.name) createData.name = req.body.name;
    if (req.body.description) createData.description = req.body.description;
    if (req.body.starRating) createData.starRating = parseInt(req.body.starRating);
    if (req.body.status) createData.status = req.body.status;
    if (req.body.ownerId) createData.ownerId = req.body.ownerId;

    if (req.body["address[number]"] || req.body["address[street]"] || req.body["address[city]"]) {
      createData.address = {
        number: req.body["address[number]"] || req.body.address?.number || "",
        street: req.body["address[street]"] || req.body.address?.street || "",
        city: req.body["address[city]"] || req.body.address?.city || ""
      };
    } else if (req.body.address && typeof req.body.address === "object") {
      createData.address = req.body.address;
    }

    if (req.body["contactInfo[phone]"] || req.body["contactInfo[email]"]) {
      createData.contactInfo = {
        phone: req.body["contactInfo[phone]"] || req.body.contactInfo?.phone || "",
        email: req.body["contactInfo[email]"] || req.body.contactInfo?.email || ""
      };
    } else if (req.body.contactInfo && typeof req.body.contactInfo === "object") {
      createData.contactInfo = req.body.contactInfo;
    }

    if (req.body["policies[checkInTime]"] || req.body["policies[checkOutTime]"]) {
      createData.policies = {
        checkInTime: req.body["policies[checkInTime]"] || req.body.policies?.checkInTime || "14:00",
        checkOutTime: req.body["policies[checkOutTime]"] || req.body.policies?.checkOutTime || "12:00"
      };
    } else if (req.body.policies && typeof req.body.policies === "object") {
      createData.policies = req.body.policies;
    }

    const newHotel = new Hotel({
      ...createData,
      images: images
    });

    const qrText = resolveQrTextFields(req.body, {});
    const qrImageUrl = qrFile ? resolveHotelUploadedImageUrl(qrFile) : "";
    const qrPayload = {
      accountName: qrText.accountName || "",
      accountNumber: qrText.accountNumber || "",
      bankName: qrText.bankName || "",
      qrImageUrl
    };
    if (!isQrConfigComplete(qrPayload)) {
      return res.status(400).json({
        message:
          "Thiếu thông tin thanh toán QR: vui lòng cung cấp tên chủ TK, số TK, ngân hàng và ảnh QR."
      });
    }
    const paymentConfigPayload = { qr: qrPayload };
    const vnpayText = resolveVnpayFields(req.body, {});
    const hasVnpayInput =
      vnpayText.tmnCode !== undefined ||
      vnpayText.secureSecret !== undefined;
    if (hasVnpayInput) {
      const vnpayPayload = {
        tmnCode: vnpayText.tmnCode || "",
        secureSecret: vnpayText.secureSecret || ""
      };
      const isEmptyVnpay =
        !String(vnpayPayload.tmnCode).trim() &&
        !String(vnpayPayload.secureSecret).trim();
      if (!isEmptyVnpay && !isVnpayConfigComplete(vnpayPayload)) {
        return res.status(400).json({
          message:
            "Cấu hình VNPay chưa đầy đủ: vui lòng cung cấp cả TMN Code và Secure Secret, hoặc để trống cả hai."
        });
      }
      if (!isEmptyVnpay) {
        paymentConfigPayload.vnpay = vnpayPayload;
      }
    }
    newHotel.paymentConfig = paymentConfigPayload;

    const savedHotel = await newHotel.save();
    console.log(`Đã tạo khách sạn thành công: ${savedHotel._id} (${savedHotel.name}) bởi owner ${savedHotel.ownerId}`);
    
    // Notify admins about new hotel registration request
    // Note: If hotel status is 'pending', it needs approval
    if (savedHotel.status === 'pending' || !savedHotel.status) {
      notifyAdminHotelRegistrationRequest(savedHotel._id).catch(err => {
        console.error('Lỗi khi tạo thông báo yêu cầu đăng ký khách sạn cho admin:', err);
      });
    }
    
    res.status(201).json(sanitizeHotelPaymentConfigResponse(savedHotel));
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

    const existingHotel = await Hotel.findById(req.params.id).select(
      "images " + Hotel.PAYMENT_CONFIG_SELECT
    );
    if (!existingHotel) {
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    const qrFile = getQrUploadFile(req);

    // Parse nested fields từ FormData (address[number], contactInfo[phone], etc.)
    const updateData = {};
    
    // Copy các fields đơn giản
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.starRating) updateData.starRating = parseInt(req.body.starRating);
    if (req.body.status) updateData.status = req.body.status;

    // Admin được phép đổi chủ khách sạn
    if (req.body.ownerId && req.user?.role === "admin") {
      const nextOwner = await User.findOne({
        _id: req.body.ownerId,
        role: "owner"
      }).select("_id");

      if (!nextOwner) {
        return res.status(400).json({ message: "Owner không hợp lệ" });
      }

      updateData.ownerId = req.body.ownerId;
    }

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

    // Parse paymentConfig.qr (ảnh QR chỉ từ upload `qrCodeImage` hoặc giữ URL đã lưu)
    const hasPaymentQrBracket =
      req.body['paymentConfig[qr][accountName]'] !== undefined ||
      req.body['paymentConfig[qr][accountNumber]'] !== undefined ||
      req.body['paymentConfig[qr][bankName]'] !== undefined;
    const hasPaymentQrObject = req.body.paymentConfig?.qr && typeof req.body.paymentConfig.qr === 'object';
    const hasPaymentVnpayBracket =
      req.body["paymentConfig[vnpay][tmnCode]"] !== undefined ||
      req.body["paymentConfig[vnpay][secureSecret]"] !== undefined;
    const hasPaymentVnpayObject =
      req.body.paymentConfig?.vnpay && typeof req.body.paymentConfig.vnpay === "object";
    const nextPaymentConfig = { ...(existingHotel.paymentConfig || {}) };
    let shouldUpdatePaymentConfig = false;

    if (hasPaymentQrBracket) {
      const prev = existingHotel.paymentConfig?.qr || {};
      const uploadedUrl = qrFile ? resolveHotelUploadedImageUrl(qrFile) : "";
      const qrImageUrl = uploadedUrl || (prev.qrImageUrl || "");
      const qrText = resolveQrTextFields(req.body, prev);
      const qrPayload = {
        accountName: qrText.accountName ?? "",
        accountNumber: qrText.accountNumber ?? "",
        bankName: qrText.bankName ?? "",
        qrImageUrl
      };
      if (!isQrConfigComplete(qrPayload)) {
        return res.status(400).json({
          message:
            "Thiếu thông tin thanh toán QR: vui lòng cung cấp tên chủ TK, số TK, ngân hàng và ảnh QR."
        });
      }
      nextPaymentConfig.qr = qrPayload;
      shouldUpdatePaymentConfig = true;
    } else if (hasPaymentQrObject || qrFile) {
      const qr = req.body.paymentConfig?.qr || {};
      const prev = existingHotel.paymentConfig?.qr || {};
      const uploadedUrl = qrFile ? resolveHotelUploadedImageUrl(qrFile) : "";
      const fromBody =
        qr.qrImageUrl != null && String(qr.qrImageUrl).trim() !== ""
          ? String(qr.qrImageUrl).trim()
          : "";
      const qrImageUrl = uploadedUrl || fromBody || (prev.qrImageUrl || "");
      const qrText = resolveQrTextFields(req.body, prev);
      const qrPayload = {
        accountName: qrText.accountName ?? "",
        accountNumber: qrText.accountNumber ?? "",
        bankName: qrText.bankName ?? "",
        qrImageUrl
      };
      if (!isQrConfigComplete(qrPayload)) {
        return res.status(400).json({
          message:
            "Thiếu thông tin thanh toán QR: vui lòng cung cấp tên chủ TK, số TK, ngân hàng và ảnh QR."
        });
      }
      nextPaymentConfig.qr = qrPayload;
      shouldUpdatePaymentConfig = true;
    }

    if (hasPaymentVnpayBracket || hasPaymentVnpayObject) {
      const prevVnpay = existingHotel.paymentConfig?.vnpay || {};
      const vnpayText = resolveVnpayFields(req.body, prevVnpay);
      const trimmedTmn = String(vnpayText.tmnCode || "").trim();
      const prevSecretTrimmed = String(prevVnpay?.secureSecret || "").trim();
      const hasSecretFieldInBody =
        req.body["paymentConfig[vnpay][secureSecret]"] !== undefined ||
        (req.body.paymentConfig?.vnpay &&
          Object.prototype.hasOwnProperty.call(
            req.body.paymentConfig.vnpay,
            "secureSecret"
          ));
      const incomingSecretTrimmed = hasSecretFieldInBody
        ? String(
            req.body["paymentConfig[vnpay][secureSecret]"] !== undefined
              ? req.body["paymentConfig[vnpay][secureSecret]"]
              : req.body.paymentConfig.vnpay.secureSecret ?? ""
          ).trim()
        : null;
      const keepPrevSecret = Boolean(trimmedTmn && prevSecretTrimmed);
      let nextSecret;
      if (incomingSecretTrimmed !== null && incomingSecretTrimmed !== "") {
        nextSecret = incomingSecretTrimmed;
      } else {
        nextSecret = keepPrevSecret ? prevVnpay.secureSecret : "";
      }
      const vnpayPayload = {
        tmnCode: vnpayText.tmnCode || "",
        secureSecret: nextSecret
      };
      const isEmptyVnpay =
        !String(vnpayPayload.tmnCode).trim() &&
        !String(vnpayPayload.secureSecret).trim();
      if (!isEmptyVnpay && !isVnpayConfigComplete(vnpayPayload)) {
        return res.status(400).json({
          message:
            "Cấu hình VNPay chưa đầy đủ: vui lòng cung cấp cả TMN Code và Secure Secret, hoặc để trống cả hai."
        });
      }
      if (isEmptyVnpay) {
        delete nextPaymentConfig.vnpay;
      } else {
        nextPaymentConfig.vnpay = vnpayPayload;
      }
      shouldUpdatePaymentConfig = true;
    }

    if (shouldUpdatePaymentConfig) {
      const normalizedPaymentConfig = {};
      if (nextPaymentConfig.qr) {
        normalizedPaymentConfig.qr = nextPaymentConfig.qr;
      }
      if (nextPaymentConfig.vnpay) {
        normalizedPaymentConfig.vnpay = nextPaymentConfig.vnpay;
      }
      updateData.paymentConfig = normalizedPaymentConfig;
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

    const imageFiles = getHotelImageFiles(req);
    const newImages = imageFiles.map(resolveHotelUploadedImageUrl);

    // Gộp ảnh cũ và mới (ưu tiên existingImages nếu có, nếu không có ảnh mới thì giữ nguyên ảnh cũ)
    if (existingImages.length > 0 || newImages.length > 0) {
      updateData.images = [...existingImages, ...newImages];
    }

    const updatedHotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select(Hotel.PAYMENT_CONFIG_SELECT);
    
    console.log(`Đã cập nhật khách sạn thành công: ${req.params.id} (${updatedHotel?.name})`);
    res.status(200).json(sanitizeHotelPaymentConfigResponse(updatedHotel));
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
      path: "ownerId",
      select: "name email phone _id"
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

// Get hotels by filter (nâng cao)
exports.getHotelByFilter = async (req, res) => {
  try {
    const { 
      city, 
      starRating, 
      name, 
      search,
      minPrice,
      maxPrice,
      maxPeople,
      roomType,
      amenities
    } = req.query;
    
    // Build base query for hotels
    let hotelQuery = { status: "active" }; // Chỉ lấy khách sạn đang hoạt động

    // Apply basic filters
    if (city) {
      hotelQuery["address.city"] = { $regex: city, $options: "i" };
    }
    
    if (starRating) {
      hotelQuery.starRating = parseInt(starRating);
    }

    if (name) {
      hotelQuery.name = { $regex: name, $options: "i" };
    }

    // Tìm kiếm đồng thời theo tên khách sạn và địa danh
    if (search) {
      hotelQuery.$or = [
        { name: { $regex: search, $options: "i" } },
        { "address.city": { $regex: search, $options: "i" } }
      ];
    }

    // Nếu có filter liên quan đến phòng (giá, số người, loại phòng, facilities)
    // thì cần sử dụng aggregation để join với Room
    const hasRoomFilters = minPrice || maxPrice || maxPeople || roomType || amenities;

    if (hasRoomFilters) {
      // Build room query
      let roomQuery = { roomStatus: "active" }; // Chỉ lấy phòng đang hoạt động

      if (minPrice || maxPrice) {
        roomQuery["price.regular"] = {};
        if (minPrice) {
          roomQuery["price.regular"].$gte = parseInt(minPrice);
        }
        if (maxPrice) {
          roomQuery["price.regular"].$lte = parseInt(maxPrice);
        }
      }

      if (maxPeople) {
        roomQuery.maxPeople = { $gte: parseInt(maxPeople) };
      }

      if (roomType) {
        const roomTypes = Array.isArray(roomType) ? roomType : [roomType];
        roomQuery.type = { $in: roomTypes };
      }

      // Filter by facilities (tiện ích phòng)
      if (amenities) {
        let facilitiesArray;
        if (Array.isArray(amenities)) {
          facilitiesArray = amenities;
        } else if (typeof amenities === 'string') {
          // Xử lý trường hợp amenities là string (comma-separated từ query params)
          facilitiesArray = amenities.split(',').filter(a => a.trim() !== '');
        } else {
          facilitiesArray = [amenities];
        }
        
        if (facilitiesArray.length > 0) {
          // Lọc phòng có chứa tất cả các facilities được chọn (sử dụng $all)
          roomQuery.facilities = { $all: facilitiesArray };
        }
      }

      // Tìm các phòng thỏa mãn điều kiện
      const matchingRooms = await Room.find(roomQuery).select('hotelId');
      const hotelIds = [...new Set(matchingRooms.map(room => room.hotelId.toString()))];

      // Thêm filter hotelIds vào hotelQuery
      if (hotelIds.length > 0) {
        hotelQuery._id = { $in: hotelIds.map(id => new mongoose.Types.ObjectId(id)) };
      } else {
        // Nếu không có phòng nào thỏa mãn, trả về mảng rỗng
        return res.status(200).json([]);
      }
    }

    // Tìm các khách sạn thỏa mãn điều kiện
    const hotels = await Hotel.find(hotelQuery)
      .populate({
        path: "ownerId",
        select: "name email phone _id"
      })
      .sort({ createdAt: -1 });
      
    res.status(200).json(hotels);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách khách sạn theo bộ lọc:", error);
    res.status(500).json({ 
      message: "Lỗi khi lấy danh sách khách sạn theo bộ lọc", 
      error: error.message 
    });
  }
};