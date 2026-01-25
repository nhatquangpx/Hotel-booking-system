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
      totalAmount,
      specialRequests
    } = req.body;

    const booking = await bookingService.createGuestBooking({
      hotelId,
      roomId,
      checkInDate,
      checkOutDate,
      paymentMethod,
      totalAmount,
      specialRequests
    }, req.user.id);

    res.status(201).json(booking);
  } catch (error) {
    console.error("Lỗi khi tạo đặt phòng:", error);
    const statusCode = error.message.includes("Không tìm thấy") ? 404 : 
                      error.message.includes("không khả dụng") || 
                      error.message.includes("đã được đặt") ? 400 : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi khi tạo đặt phòng" });
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
    const bookings = await bookingService.getBookingsByOwner(req.user.id);
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
    const statusCode = error.message.includes("Ngày không hợp lệ") || 
                      error.message.includes("ngày check-in") ? 400 : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi khi tìm kiếm phòng trống" });
  }
};

// Update booking status (Admin, Owner)
exports.updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const { role } = req.user;

    let booking;
    let oldStatus;

    // Get old status before update
    const oldBooking = await Booking.findById(id);
    if (oldBooking) {
      oldStatus = oldBooking.paymentStatus;
    }

    // Use appropriate service based on user role
    if (role === "admin") {
      booking = await bookingService.updateAdminBookingStatus(id, status, req.user);
    } else if (role === "owner") {
      booking = await bookingService.updateOwnerBookingStatus(id, status, req.user);
    } else {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    // Send notifications if status changed to paid
    if (status === "paid" && oldStatus !== "paid") {
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
    const { cancellationReason } = req.body;

    const booking = await bookingService.cancelGuestBooking(id, cancellationReason, req.user);

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
    const statusCode = error.message.includes("Không tìm thấy") ? 404 : 
                      error.message.includes("không có quyền") ? 403 :
                      error.message.includes("không thể hủy") || 
                      error.message.includes("đã được hủy") ? 400 : 500;
    res.status(statusCode).json({ message: error.message || "Lỗi khi hủy đơn đặt phòng" });
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