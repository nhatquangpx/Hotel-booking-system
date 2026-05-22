const Review = require("../models/Review");
const Booking = require("../models/Booking");
const { 
  notifyBookingCancelled, 
  notifyCheckIn, 
  notifyCheckOut, 
  notifyPaymentSuccessful,
  notifyGuestBookingConfirmed,
  notifyGuestBookingCancelled,
  notifyGuestBookingExpired,
} = require("../services/notifications");
const { sendReceiptEmail, sendCheckInReminderIfNeeded } = require("../services/emails");

const bookingService = require("../services/bookings");

// Create a new booking (Guest only)
exports.createBooking = async (req, res) => {
  try {
    const {
      hotel: hotelId,
      room: roomId,
      checkInDate,
      checkOutDate,
      paymentMethod,
      specialRequests
    } = req.body;

    const booking = await bookingService.createGuestBooking({
      hotelId,
      roomId,
      checkInDate,
      checkOutDate,
      paymentMethod,
      specialRequests
    }, req.user.id);

    res.status(201).json(booking);
  } catch (error) {
    console.error("Lỗi khi tạo đặt phòng:", error);
    const statusCode = error.statusCode || (error.message.includes("Không tìm thấy") ? 404 : 
                      error.message.includes("không khả dụng") || 
                      error.message.includes("đã được đặt") ? 400 : 500);
    res.status(statusCode).json({ message: error.message || "Lỗi khi tạo đặt phòng" });
  }
};

// Xem trước giá (guest) — cùng logic server khi tạo booking
exports.getPricePreview = async (req, res) => {
  try {
    const { hotelId, roomId, checkInDate, checkOutDate } = req.query;
    if (!hotelId || !roomId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Thiếu hotelId, roomId, checkInDate hoặc checkOutDate" });
    }
    const preview = await bookingService.previewBookingPrice(
      hotelId,
      roomId,
      checkInDate,
      checkOutDate
    );
    res.json(preview);
  } catch (error) {
    console.error("Lỗi xem trước giá:", error);
    const statusCode =
      error.message.includes("Không tìm thấy")
        ? 404
        : error.message.includes("Ngày") || error.message.includes("Phải đặt ít nhất")
          ? 400
          : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi xem trước giá" });
  }
};

// Get all bookings for current user (Guest)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getMyBookings(req.user.id);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng", error: error.message });
  }
};

// Get all bookings for a specific user (Admin only)
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.params.userId;
    const bookings = await bookingService.getUserBookings(userId);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng", error: error.message });
  }
};

// Get all bookings with optional filters (Admin only)
exports.getAllBookings = async (req, res) => {
  try {
    const { paymentStatus, fromDate, toDate } = req.query;
    const bookings = await bookingService.getAllBookings({
      paymentStatus,
      fromDate,
      toDate
    });
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy tất cả đặt phòng:", error);
    res.status(500).json({ message: "Lỗi khi lấy tất cả đặt phòng", error: error.message });
  }
};

// Get bookings by owner (for owner's hotels)
exports.getBookingsByOwner = async (req, res) => {
  try {
    const { hotelId } = req.query;
    const bookings = await bookingService.getBookingsByOwner(req.user.id, hotelId || null);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng của chủ khách sạn:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng của chủ khách sạn", error: error.message });
  }
};

// Get booking details by ID (Guest, Owner, Admin)
exports.getBookingById = async (req, res) => {
  try {
    let booking;
    
    // Use appropriate service based on user role
    if (req.user.role === "admin") {
      booking = await bookingService.getAdminBookingById(req.params.id, req.user);
    } else if (req.user.role === "owner") {
      booking = await bookingService.getOwnerBookingById(req.params.id, req.user);
    } else {
      booking = await bookingService.getGuestBookingById(req.params.id, req.user);
    }

    // Find review for this booking if exists
    const review = await Review.findOne({ booking: booking._id })
      .populate({
        path: "guest",
        select: "name email"
      });

    // Add review to booking object
    const bookingObj = booking.toObject ? booking.toObject() : booking;
    if (review) {
      bookingObj.review = review;
    }
    if (bookingObj.hotel?.paymentConfig?.vnpay) {
      delete bookingObj.hotel.paymentConfig.vnpay.secureSecret;
    }

    res.status(200).json(bookingObj);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn đặt phòng:", error);
    const statusCode = error.message.includes("Không tìm thấy") ? 404 : 
                      error.message.includes("không có quyền") ? 403 : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi khi lấy thông tin đơn đặt phòng" });
  }
};

// Get available rooms for a hotel by date range (Guest)
exports.getAvailableRooms = async (req, res) => {
  try {
    const { hotelId, checkInDate, checkOutDate } = req.query;

    if (!hotelId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ hotelId, checkInDate và checkOutDate" });
    }

    const availableRooms = await bookingService.getAvailableRooms(hotelId, checkInDate, checkOutDate);
    res.status(200).json(availableRooms);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm phòng trống:", error);
    const statusCode = error.message.includes("Không tìm thấy khách sạn")
      ? 404
      : error.message.includes("Ngày không hợp lệ") ||
          error.message.includes("ngày check-in") ||
          error.message.includes("Phải đặt ít nhất") ||
          error.message.includes("Ngày check-out phải sau")
        ? 400
        : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi khi tìm kiếm phòng trống" });
  }
};

// Cập nhật trạng thái đơn (Owner only — admin chỉ đọc đơn qua GET /admin/bookings)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role } = req.user;

    if (role === "admin") {
      return res.status(403).json({
        message: "Admin chỉ được xem đơn đặt phòng và thống kê, không được chỉnh trạng thái đơn."
      });
    }

    let booking;
    let oldStatus;

    // Get old status before update
    const oldBooking = await Booking.findById(id);
    if (oldBooking) {
      oldStatus = oldBooking.paymentStatus;
    }

    if (role === "owner") {
      booking = await bookingService.updateOwnerBookingStatus(id, status, req.user);
    } else {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    // Send notifications and email receipt if status changed to paid
    if (status === "paid" && oldStatus !== "paid") {
      // Populate booking với đầy đủ thông tin để gửi email hóa đơn
      const populatedBooking = await Booking.findById(id)
        .populate('guest', 'name email phone')
        .populate('hotel', 'name address contactInfo')
        .populate('room', 'roomNumber type price maxPeople');

      // Gửi email hóa đơn điện tử
      if (populatedBooking && populatedBooking.guest && populatedBooking.guest.email) {
        const paymentMethod = populatedBooking.paymentMethod || 'qr_code';
        sendReceiptEmail(
          populatedBooking,
          paymentMethod,
          populatedBooking.vnpTransactionRef || null
        ).then(success => {
          if (success) {
            console.log(`Đã gửi email hóa đơn cho booking ${id} (cập nhật thủ công)`);
          } else {
            console.error(`Không thể gửi email hóa đơn cho booking ${id}`);
          }
        }).catch(err => {
          console.error('Lỗi khi gửi email hóa đơn:', err);
        });

        // Gửi email nhắc nhở check-in ngay nếu checkInDate là 1-2 ngày sau
        sendCheckInReminderIfNeeded(populatedBooking).catch(err => {
          console.error('Lỗi khi gửi email nhắc nhở check-in:', err);
        });
      }

      // Notify owner about new booking (after payment)
      notifyPaymentSuccessful(id).catch(err => {
        console.error('Lỗi khi tạo thông báo đặt phòng mới cho owner:', err);
      });

      // Notify guest about booking confirmation
      notifyGuestBookingConfirmed(id).catch(err => {
        console.error('Lỗi khi tạo thông báo xác nhận đặt phòng cho guest:', err);
      });
    }

    res.status(200).json({ message: "Cập nhật trạng thái thành công", booking });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn đặt phòng:", error);
    const statusCode = error.message.includes("Không tìm thấy") || 
                      error.message.includes("không tồn tại") ? 404 :
                      error.message.includes("không có quyền") || 
                      error.message.includes("không hợp lệ") ? 
                      (error.message.includes("không hợp lệ") ? 400 : 403) : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi server" });
  }
};

// Cancel booking (Guest only)
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    const booking = await bookingService.cancelGuestBooking(id, req.body || {}, req.user);

    // Send notifications
    notifyBookingCancelled(id).catch(err => {
      console.error('Lỗi khi tạo thông báo hủy đặt phòng cho owner:', err);
    });

    notifyGuestBookingCancelled(id).catch(err => {
      console.error('Lỗi khi tạo thông báo hủy đặt phòng cho guest:', err);
    });

    res.status(200).json({ 
      message: "Đã hủy đơn đặt phòng thành công", 
      booking 
    });
  } catch (error) {
    console.error("Lỗi khi hủy đơn đặt phòng:", error);
    const statusCode =
      error.statusCode ||
      (error.message.includes("Không tìm thấy")
        ? 404
        : error.message.includes("không có quyền")
          ? 403
          : error.message.includes("không thể hủy") ||
              error.message.includes("đã được hủy") ||
              error.message.includes("Theo quy định khách sạn") ||
              error.message.includes("Vui lòng nhập")
            ? 400
            : 500);
    res.status(statusCode).json({ message: error.message || "Lỗi khi hủy đơn đặt phòng" });
  }
};

// Chủ KS xác nhận đã hoàn tiền (đơn khách đã hủy, đủ điều kiện hoàn)
exports.confirmGuestRefund = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.confirmOwnerGuestRefund(id, req.user, req.file);
    res.status(200).json({
      message: "Đã xác nhận hoàn tiền cho khách",
      booking
    });
  } catch (error) {
    console.error("Lỗi khi xác nhận hoàn tiền:", error);
    const statusCode =
      error.statusCode ||
      (error.message.includes("Không tìm thấy") || error.message.includes("không tồn tại")
        ? 404
        : error.message.includes("không có quyền")
          ? 403
          : error.message.includes("Chỉ xác nhận") ||
              error.message.includes("Không thể") ||
              error.message.includes("Vui lòng tải lên ảnh minh chứng") ||
              error.message.includes("chưa gửi") ||
              error.message.includes("không thuộc") ||
              error.message.includes("Đã xác nhận")
            ? 400
            : 500);
    res.status(statusCode).json({ message: error.message || "Lỗi khi xác nhận hoàn tiền" });
  }
};

// Check-in booking (Owner only)
exports.checkIn = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.checkIn(id, req.user);

    // Send notification
    notifyCheckIn(id).catch(err => {
      console.error('Lỗi khi tạo thông báo check-in:', err);
    });
    res.status(200).json({ 
      message: "Check-in thành công", 
      booking 
    });
  } catch (error) {
    console.error("Lỗi khi check-in:", error);
    const statusCode = error.message.includes("Không tìm thấy") || 
                      error.message.includes("không tồn tại") ? 404 :
                      error.message.includes("không có quyền") || 
                      error.message.includes("không tìm thấy thông tin") ? 403 :
                      error.message.includes("đã được check-in") || 
                      error.message.includes("chưa thanh toán") ? 400 : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi khi check-in" });
  }
};

// Check-out booking (Owner only)
exports.checkOut = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.checkOut(id, req.user);

    // Send notification
    notifyCheckOut(id).catch(err => {
      console.error('Lỗi khi tạo thông báo check-out:', err);
    });
    res.status(200).json({ 
      message: "Check-out thành công", 
      booking 
    });
  } catch (error) {
    console.error("Lỗi khi check-out:", error);
    const statusCode = error.message.includes("Không tìm thấy") || 
                      error.message.includes("không tồn tại") ? 404 :
                      error.message.includes("không có quyền") || 
                      error.message.includes("không tìm thấy thông tin") ? 403 :
                      error.message.includes("đã được check-out") || 
                      error.message.includes("chưa check-in") ? 400 : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi khi check-out" });
  }
};

function handleBookingServiceError(res, error, logLabel, fallbackMessage) {
  if (error?.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  console.error(logLabel, error);
  const statusCode =
    error.message?.includes("Không tìm thấy") || error.message?.includes("không tồn tại")
      ? 404
      : error.message?.includes("không có quyền")
        ? 403
        : error.message?.includes("đã được") ||
            error.message?.includes("chưa") ||
            error.message?.includes("Chỉ có thể")
          ? 400
          : 500;
  return res.status(statusCode).json({ message: error.message || fallbackMessage });
}

/** Staff: danh sách đơn khách sạn đã gán. */
exports.getStaffBookings = async (req, res) => {
  try {
    const bookings = await bookingService.getBookingsByStaff(req.user.id);
    res.status(200).json(bookings);
  } catch (error) {
    return handleBookingServiceError(
      res,
      error,
      "Lỗi khi lấy danh sách đặt phòng (staff):",
      "Lỗi khi lấy danh sách đặt phòng"
    );
  }
};

/** Staff: chi tiết đơn. */
exports.getStaffBookingById = async (req, res) => {
  try {
    const booking = await bookingService.getStaffBookingById(req.params.id, req.user);
    const review = await Review.findOne({ booking: booking._id }).populate({
      path: "guest",
      select: "name email",
    });
    const bookingObj = booking.toObject ? booking.toObject() : { ...booking };
    if (review) {
      bookingObj.review = review;
    }
    if (bookingObj.hotel?.paymentConfig?.vnpay) {
      delete bookingObj.hotel.paymentConfig.vnpay.secureSecret;
    }
    res.status(200).json(bookingObj);
  } catch (error) {
    return handleBookingServiceError(
      res,
      error,
      "Lỗi khi lấy chi tiết đơn (staff):",
      "Lỗi khi lấy thông tin đơn đặt phòng"
    );
  }
};

/** Staff: check-in. */
exports.staffCheckIn = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.staffCheckIn(id, req.user);
    notifyCheckIn(id).catch((err) => {
      console.error("Lỗi khi tạo thông báo check-in:", err);
    });
    res.status(200).json({ message: "Check-in thành công", booking });
  } catch (error) {
    return handleBookingServiceError(res, error, "Lỗi khi check-in (staff):", "Lỗi khi check-in");
  }
};

/** Staff: check-out. */
exports.staffCheckOut = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await bookingService.staffCheckOut(id, req.user);
    notifyCheckOut(id).catch((err) => {
      console.error("Lỗi khi tạo thông báo check-out:", err);
    });
    res.status(200).json({ message: "Check-out thành công", booking });
  } catch (error) {
    return handleBookingServiceError(res, error, "Lỗi khi check-out (staff):", "Lỗi khi check-out");
  }
};