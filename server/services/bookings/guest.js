const Booking = require("../../models/Booking");
const Room = require("../../models/Room");
const Hotel = require("../../models/Hotel");
const {
  checkRoomAvailability,
  validateBookingDates,
  checkBookingPermission,
  canCancelBooking,
  getBookingWithPopulate,
  getBookingById: getBookingByIdCore,
  refreshRoomBookingStatus
} = require("./core");
const {
  computeStaySalePricing,
  computeStaySalePricingFromSales,
  loadSalesOverlappingStay,
} = require("../sale/salePricingService");

/**
 * Guest Booking Service
 * All booking operations specific to guest role
 */

/**
 * Create a new booking
 * @param {Object} bookingData - Booking data
 * @param {String} bookingData.hotelId - Hotel ID
 * @param {String} bookingData.roomId - Room ID
 * @param {Date|String} bookingData.checkInDate - Check-in date
 * @param {Date|String} bookingData.checkOutDate - Check-out date
 * @param {String} bookingData.paymentMethod - Payment method
 * @param {String} bookingData.specialRequests - Special requests (optional)
 * @param {String} guestId - Guest user ID
 * @returns {Promise<Object>} Created booking
 */
const createBooking = async (bookingData, guestId) => {
  const { hotelId, roomId, checkInDate, checkOutDate, paymentMethod, specialRequests } = bookingData;

  // 1. Validate dates
  const dateValidation = validateBookingDates(checkInDate, checkOutDate);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.error);
  }

  // 2. Check if hotel exists FIRST
  const hotel = await Hotel.findById(hotelId).select("+paymentConfig");
  if (!hotel) {
    throw new Error("Không tìm thấy khách sạn");
  }

  // 3. Check if room exists
  const room = await Room.findById(roomId);
  if (!room) {
    throw new Error("Không tìm thấy phòng");
  }

  // 4. Verify room belongs to the hotel (Security check)
  if (room.hotelId.toString() !== hotelId) {
    throw new Error("Phòng không thuộc về khách sạn đã chọn");
  }

  // 5. Check room availability (includes room status, booking status, and date conflicts)
  const isAvailable = await checkRoomAvailability(room, checkInDate, checkOutDate);
  if (!isAvailable) {
    throw new Error("Phòng không khả dụng cho đặt chỗ");
  }

  // 6. Tính tiền và snapshot ở server (không tin totalAmount từ client)
  const pricing = await computeStaySalePricing(room, hotelId, checkInDate, checkOutDate);
  const calculatedAmount = pricing.finalAmount;

  const method = paymentMethod || "qr_code";
  if (method === "qr_code") {
    const qr = hotel.paymentConfig?.qr;
    const qrReady =
      String(qr?.accountName || "").trim() &&
      String(qr?.accountNumber || "").trim() &&
      String(qr?.bankName || "").trim() &&
      String(qr?.qrImageUrl || "").trim();
    if (!qrReady) {
      const err = new Error(
        "Khách sạn chưa cấu hình đủ thanh toán QR (tên chủ TK, số TK, ngân hàng và ảnh mã QR). Vui lòng chọn VNPay hoặc liên hệ khách sạn."
      );
      err.statusCode = 400;
      throw err;
    }
  }

  // 7. Create new booking
  const newBooking = new Booking({
    guest: guestId,
    hotel: hotelId,
    room: roomId,
    checkInDate: new Date(checkInDate),
    checkOutDate: new Date(checkOutDate),
    totalAmount: calculatedAmount,
    basePrice: pricing.basePrice,
    discountAmount: pricing.discountAmount,
    finalAmount: pricing.finalAmount,
    promotionApplied: pricing.promotionApplied || undefined,
    paymentMethod: method,
    specialRequests: specialRequests || "",
    cancellationReason: "",
    paymentStatus: "pending"
  });

  // 8. Save booking to database
  const savedBooking = await newBooking.save();

  // Update room bookingStatus based on today's bookings (pending/empty/occupied)
  await refreshRoomBookingStatus(roomId);

  // 9. Return populated booking
  return await getBookingWithPopulate(savedBooking._id, {
    hotel: "name address images starRating +paymentConfig",
    room: "roomNumber type price images"
  });
};

/**
 * Xem trước giá (guest) — cùng logic với tạo đặt phòng
 */
const previewBookingPrice = async (hotelId, roomId, checkInDate, checkOutDate) => {
  const dateValidation = validateBookingDates(checkInDate, checkOutDate);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.error);
  }

  const hotel = await Hotel.findById(hotelId).select("+paymentConfig");
  if (!hotel) {
    throw new Error("Không tìm thấy khách sạn");
  }

  const room = await Room.findById(roomId);
  if (!room) {
    throw new Error("Không tìm thấy phòng");
  }

  if (room.hotelId.toString() !== hotelId) {
    throw new Error("Phòng không thuộc về khách sạn đã chọn");
  }

  const pricing = await computeStaySalePricing(room, hotelId, checkInDate, checkOutDate);
  return {
    hotelId,
    roomId,
    checkInDate,
    checkOutDate,
    ...pricing,
  };
};

/**
 * Get all bookings for a guest
 * @param {String} guestId - Guest user ID
 * @returns {Promise<Array>} Array of bookings
 */
const getMyBookings = async (guestId) => {
  const bookings = await Booking.find({ guest: guestId })
    .populate({
      path: "hotel",
      select: "name address images starRating +paymentConfig"
    })
    .populate({
      path: "room",
      select: "roomNumber type price images"
    })
    .sort({ createdAt: -1 });

  return bookings;
};

/**
 * Get booking by ID (with permission check for guest)
 * @param {String} bookingId - Booking ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Booking object
 */
const getBookingById = async (bookingId, user) => {
  return await getBookingByIdCore(bookingId, user, {
    hotel: "name address images starRating contactInfo policies +paymentConfig",
    room: "roomNumber type price images maxPeople description facilities"
  });
};

/**
 * Get available rooms for a hotel by date range
 * @param {String} hotelId - Hotel ID
 * @param {Date|String} checkInDate - Check-in date
 * @param {Date|String} checkOutDate - Check-out date
 * @returns {Promise<Array>} Array of available rooms
 */
const getAvailableRooms = async (hotelId, checkInDate, checkOutDate) => {
  // Validate dates
  const dateValidation = validateBookingDates(checkInDate, checkOutDate);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.error);
  }

  // Find all rooms in the hotel
  const allRooms = await Room.find({ hotelId: hotelId });

  const startDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);

  const availableRooms = [];

  const sales = await loadSalesOverlappingStay(hotelId, checkInDate, checkOutDate);

  for (const room of allRooms) {
    const isAvailable = await checkRoomAvailability(room, startDate, endDate);

    if (isAvailable) {
      const pricing = computeStaySalePricingFromSales(room, checkInDate, checkOutDate, sales);
      const roomObj = room.toObject ? room.toObject() : { ...room };
      roomObj.salePricing = {
        basePrice: pricing.basePrice,
        finalAmount: pricing.finalAmount,
        discountAmount: pricing.discountAmount,
        displayPercentOff: pricing.displayPercentOff,
        promotionTitle: pricing.promotionApplied?.title || null,
        nightlyBase: pricing.nightlyBase,
        finalNightly: pricing.finalNightly,
        nights: pricing.nights,
        regularNightly: room.price?.regular ?? 0,
      };
      availableRooms.push(roomObj);
    }
  }

  return availableRooms;
};

/**
 * Cancel a booking
 * @param {String} bookingId - Booking ID
 * @param {String} cancellationReason - Cancellation reason
 * @param {Object} user - User object
 * @returns {Promise<Object>} Updated booking
 */
const cancelBooking = async (bookingId, cancellationReason, user) => {
  const booking = await Booking.findById(bookingId).populate("hotel");

  if (!booking) {
    throw new Error("Không tìm thấy đơn đặt phòng");
  }

  // Check permission (guest can only cancel their own bookings)
  if (!checkBookingPermission(booking, user)) {
    throw new Error("Bạn không có quyền hủy đơn đặt phòng này");
  }

  // Check if booking can be cancelled
  const cancelValidation = canCancelBooking(booking);
  if (!cancelValidation.canCancel) {
    throw new Error(cancelValidation.error);
  }

  // Update booking status to cancelled
  const updatedBooking = await Booking.findByIdAndUpdate(
    bookingId,
    {
      paymentStatus: "cancelled",
      cancellationReason: cancellationReason || ""
    },
    { new: true }
  );

  // Refresh room bookingStatus after cancellation
  await refreshRoomBookingStatus(booking.room);

  return updatedBooking;
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  getAvailableRooms,
  cancelBooking,
  previewBookingPrice,
};