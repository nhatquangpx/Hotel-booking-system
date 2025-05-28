const BookingHistory = require("../models/BookingHistory");
const Room = require("../models/Room");
const Hotel = require("../models/Hotel");

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    const {
      hotelId,
      roomId,
      checkInDate,
      checkOutDate,
      guestDetails,
      paymentMethod,
      specialRequests
    } = req.body;

    // Validate dates
    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    const today = new Date();

    if (startDate < today) {
      return res.status(400).json({ message: "Check-in date cannot be in the past" });
    }

    if (endDate <= startDate) {
      return res.status(400).json({ message: "Check-out date must be after check-in date" });
    }

    // Calculate number of nights
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));

    // Check if room exists and is available
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (room.status !== "available") {
      return res.status(400).json({ message: "Room is not available for booking" });
    }

    // Check if hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({ message: "Hotel not found" });
    }

    // Check if room is already booked for the selected dates
    const existingBooking = await BookingHistory.findOne({
      room: roomId,
      $or: [
        { 
          checkInDate: { $lte: endDate },
          checkOutDate: { $gte: startDate }
        }
      ],
      paymentStatus: { $in: ["pending", "paid"] }
    });

    if (existingBooking) {
      return res.status(400).json({ message: "Room is already booked for the selected dates" });
    }

    // Calculate total amount (room price * number of nights)
    const totalAmount = room.price.regular * nights;

    // Create new booking
    const newBooking = new BookingHistory({
      user: req.user.id,
      hotel: hotelId,
      room: roomId,
      checkInDate: startDate,
      checkOutDate: endDate,
      guestDetails,
      totalAmount,
      paymentMethod,
      specialRequests
    });

    // Save booking to database
    const savedBooking = await newBooking.save();

    // Update room status to booked
    await Room.findByIdAndUpdate(roomId, { status: "booked" });

    res.status(201).json(savedBooking);
  } catch (error) {
    res.status(500).json({ message: "Error creating booking", error: error.message });
  }
};

// Get all bookings for the current user
exports.getUserBookings = async (req, res) => {
  try {
    const bookings = await BookingHistory.find({ user: req.user.id })
      .populate({
        path: "hotel",
        select: "name address images starRating"
      })
      .populate({
        path: "room",
        select: "name type price images"
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bookings", error: error.message });
  }
};

// Get booking details by ID
exports.getBookingById = async (req, res) => {
  try {
    const booking = await BookingHistory.findById(req.params.id)
      .populate({
        path: "hotel",
        select: "name address images starRating contactInfo policies"
      })
      .populate({
        path: "room",
        select: "name type price images"
      });

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
    }

    // Kiểm tra quyền truy cập: admin hoặc chủ booking
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền xem đơn đặt phòng này" });
    }

    res.status(200).json(booking);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy thông tin đơn đặt phòng", error: error.message });
  }
};

// Cancel booking (only if not paid and before 2 days of check-in)
exports.cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const { cancellationReason } = req.body;

    const booking = await BookingHistory.findById(id);

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
    }

    // Kiểm tra quyền truy cập: admin hoặc chủ booking
    if (booking.user.toString() !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ message: "Bạn không có quyền hủy đơn đặt phòng này" });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === "paid") {
      return res.status(400).json({ message: "Không thể hủy đơn đặt phòng đã thanh toán" });
    }
    
    // Check if booking is already cancelled
    if (booking.paymentStatus === "cancelled") {
      return res.status(400).json({ message: "Đơn đặt phòng đã được hủy trước đó" });
    }

    // Check if check-in date is less than 2 days away
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));

    if (daysUntilCheckIn < 2) {
      return res.status(400).json({ 
        message: "Không thể hủy đơn đặt phòng trong vòng 2 ngày trước ngày nhận phòng" 
      });
    }

    // Update booking status to cancelled
    const updatedBooking = await BookingHistory.findByIdAndUpdate(
      id,
      {
        paymentStatus: "cancelled",
        cancellationReason
      },
      { new: true }
    );

    // Update room status back to available
    await Room.findByIdAndUpdate(booking.room, { status: "available" });

    res.status(200).json({ 
      message: "Đã hủy đơn đặt phòng thành công", 
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi hủy đơn đặt phòng", error: error.message });
  }
};

// Get all bookings (admin only)
exports.getAllBookings = async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized to access all bookings" });
    }

    const { status, fromDate, toDate } = req.query;
    let query = {};

    if (status) {
      query.paymentStatus = status;
    }

    if (fromDate && toDate) {
      query.createdAt = {
        $gte: new Date(fromDate),
        $lte: new Date(toDate)
      };
    }

    const bookings = await BookingHistory.find(query)
      .populate({
        path: "user",
        select: "fullName email phone"
      })
      .populate({
        path: "hotel",
        select: "name address"
      })
      .populate({
        path: "room",
        select: "name type"
      })
      .sort({ createdAt: -1 });

    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: "Error fetching all bookings", error: error.message });
  }
}; 