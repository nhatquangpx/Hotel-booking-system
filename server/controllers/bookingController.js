const BookingHistory = require("../models/Booking");
const Room = require("../models/Room");
const Hotel = require("../models/Hotel");

// Create a new booking
exports.createBooking = async (req, res) => {
  try {
    // Các trường đã được validation qua middleware bookingValidation và validateDates
    const {
      hotel: hotelId,
      room: roomId,
      checkInDate,
      checkOutDate,
      paymentMethod,
      totalAmount,
      specialRequests
    } = req.body;

    console.log(`Đang tạo đặt phòng mới: Phòng ${roomId} tại khách sạn ${hotelId}`);
    console.log(`Thời gian: ${checkInDate} đến ${checkOutDate}`);

    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);
    
    // Calculate number of nights
    const nights = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
    console.log(`Số đêm: ${nights}`);

    // Check if room exists and is available
    const room = await Room.findById(roomId);
    if (!room) {
      console.log(`Không tìm thấy phòng với ID: ${roomId}`);
      return res.status(404).json({ message: "Không tìm thấy phòng" });
    }

    if (room.status !== "active") {
      console.log(`Phòng ${roomId} không khả dụng, trạng thái hiện tại: ${room.status}`);
      return res.status(400).json({ message: "Phòng không khả dụng cho đặt chỗ" });
    }

    // Check if hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      console.log(`Không tìm thấy khách sạn với ID: ${hotelId}`);
      return res.status(404).json({ message: "Không tìm thấy khách sạn" });
    }

    // Check if room is already booked for the selected dates
    const existingBooking = await BookingHistory.findOne({
      room: roomId,
      $or: [
        { 
          checkInDate: { $lt: endDate },
          checkOutDate: { $gt: startDate }
        }
      ],
      paymentStatus: { $in: ["pending", "paid"] }
    });

    if (existingBooking) {
      console.log(`Phòng ${roomId} đã được đặt trong khoảng thời gian yêu cầu`);
      return res.status(400).json({ message: "Phòng đã được đặt cho khoảng thời gian đã chọn" });
    }

    // Tính tổng tiền nếu không được cung cấp
    let calculatedAmount = totalAmount;
    if (!calculatedAmount) {
      calculatedAmount = room.price.regular * nights;
      if (room.price.discount) {
        calculatedAmount -= room.price.discount * nights;
      }
      console.log(`Tính toán tổng tiền: ${calculatedAmount}`);
    }

    // Create new booking
    const newBooking = new BookingHistory({
      guest: req.user.id,
      hotel: hotelId,
      room: roomId,
      checkInDate: startDate,
      checkOutDate: endDate,
      totalAmount: calculatedAmount,
      paymentMethod,
      specialRequests,
      cancellationReason: "",
      paymentStatus: "pending" // Mặc định
    });

    // Save booking to database
    const savedBooking = await newBooking.save();
    console.log(`Đã tạo đặt phòng thành công, ID: ${savedBooking._id}`);

    res.status(201).json(savedBooking);
  } catch (error) {
    console.error("Lỗi khi tạo đặt phòng:", error);
    res.status(500).json({ message: "Lỗi khi tạo đặt phòng", error: error.message });
  }
};

// Get all bookings for the current user
exports.getUserBookings = async (req, res) => {
  try {
    console.log(`Lấy danh sách đặt phòng của người dùng ID: ${req.user.id}`);
      const bookings = await BookingHistory.find({ guest: req.user.id })
      .populate({
        path: "hotel",
        select: "name address images starRating"
      })
      .populate({
        path: "room",
        select: "roomNumber type price images"
      })
      .sort({ createdAt: -1 });

    console.log(`Đã tìm thấy ${bookings.length} đặt phòng của người dùng`);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng", error: error.message });
  }
};

// Get all bookings (admin only)
exports.getAllBookings = async (req, res) => {
  try {
    console.log("Admin đang lấy tất cả đặt phòng trong hệ thống");
    
    const { status, paymentStatus, fromDate, toDate } = req.query;
    let query = {};
    
    // Áp dụng bộ lọc nếu có
    if (status) query.status = status;
    if (paymentStatus) query.paymentStatus = paymentStatus;
    if (fromDate) query.checkInDate = { $gte: new Date(fromDate) };
    if (toDate) query.checkOutDate = { $lte: new Date(toDate) };
    
    console.log("Query:", JSON.stringify(query));
    
    const bookings = await BookingHistory.find(query)
      .populate({
        path: "hotel",
        select: "name address"
      })
      .populate({
        path: "room",
        select: "roomNumber type"
      })
      .populate({
        path: "user",
        select: "fullName email phone"
      })
      .sort({ createdAt: -1 });

    console.log(`Đã tìm thấy ${bookings.length} đặt phòng`);
    res.status(200).json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy tất cả đặt phòng:", error);
    res.status(500).json({ message: "Lỗi khi lấy tất cả đặt phòng", error: error.message });
  }
};

// Get bookings by owner (for owner's hotels)
exports.getBookingsByOwner = async (req, res) => {
  try {
    console.log(`Lấy danh sách đặt phòng của chủ khách sạn ID: ${req.user.id}`);

    // Tìm tất cả hotel thuộc về owner này
    const ownerHotels = await Hotel.find({ ownerId: req.user.id }).select('_id');
    const hotelIds = ownerHotels.map(hotel => hotel._id);

    const bookings = await BookingHistory.find({ hotel: { $in: hotelIds } })
      .populate({
        path: "hotel",
        select: "name address"
      })
      .populate({
        path: "room",
        select: "roomNumber type"
      })
      .populate({
        path: "guest",
        select: "name email phone"
      })
      .sort({ createdAt: -1 });

    console.log(`Tìm thấy ${bookings.length} đặt phòng cho các khách sạn của chủ sở hữu`);
    res.status(200).json(bookings);
  }
  catch (error) {
    console.error("Lỗi khi lấy danh sách đặt phòng của chủ khách sạn:", error);
    res.status(500).json({ message: "Lỗi khi lấy danh sách đặt phòng của chủ khách sạn", error: error.message });
  }
};

// Get booking details by ID
exports.getBookingById = async (req, res) => {
  try {
    console.log(`Lấy thông tin đặt phòng ID: ${req.params.id}`);
    
    const booking = await BookingHistory.findById(req.params.id)
      .populate({
        path: "hotel",
        select: "name address images starRating contactInfo policies"
      })
      .populate({
        path: "room",
        select: "roomNumber type price images"
      })
      .populate({
        path: "guest",
        select: "name email phone"
      });

    if (!booking) {
      console.log(`Không tìm thấy đặt phòng với ID: ${req.params.id}`);
      return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
    }    // Kiểm tra quyền truy cập: admin hoặc chủ booking
    if (booking.guest._id.toString() !== req.user.id && req.user.role !== "admin") {
      console.log(`Người dùng ${req.user.id} không có quyền xem đặt phòng ${req.params.id}`);
      return res.status(403).json({ message: "Bạn không có quyền xem đơn đặt phòng này" });
    }

    console.log(`Đã tìm thấy thông tin đặt phòng ${req.params.id}`);
    res.status(200).json(booking);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đơn đặt phòng:", error);
    res.status(500).json({ message: "Lỗi khi lấy thông tin đơn đặt phòng", error: error.message });
  }
};

// Get available rooms for a hotel by date range
exports.getAvailableRooms = async (req, res) => {
  try {
    const { hotelId, checkInDate, checkOutDate } = req.query;

    if (!hotelId || !checkInDate || !checkOutDate) {
      return res.status(400).json({ message: "Vui lòng cung cấp đầy đủ hotelId, checkInDate và checkOutDate" });
    }

    const startDate = new Date(checkInDate);
    const endDate = new Date(checkOutDate);

    console.log(`[getAvailableRooms] Nhận request: hotelId=${hotelId}, checkInDate=${checkInDate}, checkOutDate=${checkOutDate}`);
    console.log(`[getAvailableRooms] Đã parse ngày: startDate=${startDate.toISOString()}, endDate=${endDate.toISOString()}`);

    // Tìm tất cả các phòng thuộc khách sạn này
    const allRooms = await Room.find({ hotelId: hotelId });
    console.log(`[getAvailableRooms] Tìm thấy ${allRooms.length} phòng cho khách sạn ${hotelId}`);

    const availableRooms = [];

    for (const room of allRooms) {
      // Kiểm tra xem phòng này có bất kỳ booking nào bị trùng lặp với khoảng thời gian yêu cầu không
      const conflictingBookings = await BookingHistory.find({
        room: room._id,
        $or: [
          { 
            checkInDate: { $lt: endDate }, // Booking bắt đầu trước khi yêu cầu kết thúc
            checkOutDate: { $gt: startDate } // Booking kết thúc sau khi yêu cầu bắt đầu
          },
        ],
        paymentStatus: { $in: ["pending", "paid"] } // Chỉ xem xét các booking chưa hủy hoặc đã thanh toán
      });

      console.log(`[getAvailableRooms] Phòng ${room._id} (${room.roomNumber}): ${conflictingBookings.length} booking trùng lặp.`);

      if (conflictingBookings.length === 0) {
        // Nếu không có booking nào trùng lặp, phòng này là có sẵn
        availableRooms.push(room);
      }
    }

    console.log(`[getAvailableRooms] Tổng số phòng trống tìm thấy: ${availableRooms.length}`);
    res.status(200).json(availableRooms);
  } catch (error) {
    console.error("Lỗi khi tìm kiếm phòng trống:", error);
    res.status(500).json({ message: "Lỗi khi tìm kiếm phòng trống", error: error.message });
  }
};

// Update booking status (admin only)
exports.updateBookingStatus = async (req, res) => {
  const { bookingId } = req.params;
  const { status } = req.body;
  const { role, _id: userId } = req.user; // Lấy thông tin người dùng từ middleware xác thực

  try {
    // Tìm đơn đặt phòng
    const booking = await BookingHistory.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Đơn đặt phòng không tồn tại" });
    }

    // Kiểm tra quyền: chỉ admin hoặc owner của đơn đặt phòng được phép
    if (role !== "admin" && booking.guest.toString() !== userId.toString()) {
      return res.status(403).json({ message: "Bạn không có quyền thực hiện thao tác này" });
    }

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ["pending", "paid", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    // Cập nhật trạng thái
    booking.paymentStatus = status;
    await booking.save();

    res.status(200).json({ message: "Cập nhật trạng thái thành công", booking });
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái đơn đặt phòng:", error);
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// Cancel booking (only if not paid and before 2 days of check-in)
exports.cancelBooking = async (req, res) => {
  try {
    // Đã được validation qua middleware cancellationValidation
    const { id } = req.params;
    const { cancellationReason } = req.body;

    console.log(`Đang hủy đặt phòng ID: ${id}, Lý do: ${cancellationReason}`);

    const booking = await BookingHistory.findById(id);

    if (!booking) {
      console.log(`Không tìm thấy đặt phòng với ID: ${id}`);
      return res.status(404).json({ message: "Không tìm thấy đơn đặt phòng" });
    }    // Kiểm tra quyền truy cập: admin hoặc chủ booking
    if (booking.guest.toString() !== req.user.id && req.user.role !== "admin") {
      console.log(`Người dùng ${req.user.id} không có quyền hủy đặt phòng ${id}`);
      return res.status(403).json({ message: "Bạn không có quyền hủy đơn đặt phòng này" });
    }

    // Check if booking is already paid
    if (booking.paymentStatus === "paid") {
      console.log(`Không thể hủy đặt phòng ${id} vì đã thanh toán`);
      return res.status(400).json({ message: "Không thể hủy đơn đặt phòng đã thanh toán" });
    }
    
    // Check if booking is already cancelled
    if (booking.paymentStatus === "cancelled") {
      console.log(`Đặt phòng ${id} đã bị hủy trước đó`);
      return res.status(400).json({ message: "Đơn đặt phòng đã được hủy trước đó" });
    }

    // Check if check-in date is less than 2 days away
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));
    console.log(`Số ngày đến check-in: ${daysUntilCheckIn}`);

    if (daysUntilCheckIn < 2) {
      console.log(`Không thể hủy đặt phòng ${id} vì chỉ còn ${daysUntilCheckIn} ngày đến check-in`);
      return res.status(400).json({ 
        message: "Không thể hủy đơn đặt phòng trong vòng 2 ngày trước ngày nhận phòng" 
      });
    }

    // Update booking status to cancelled
    const updatedBooking = await BookingHistory.findByIdAndUpdate(
      id,
      {
        paymentStatus: "cancelled",
        status: "cancelled",
        cancellationReason
      },
      { new: true }
    );

    console.log(`Đã hủy đặt phòng ${id} thành công`);

    res.status(200).json({ 
      message: "Đã hủy đơn đặt phòng thành công", 
      booking: updatedBooking
    });
  } catch (error) {
    console.error("Lỗi khi hủy đơn đặt phòng:", error);
    res.status(500).json({ message: "Lỗi khi hủy đơn đặt phòng", error: error.message });
  }
}; 