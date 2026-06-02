const Booking = require("../../models/Booking");
const Room = require("../../models/Room");
const Hotel = require("../../models/Hotel");
const {
  checkRoomAvailability,
  validateBookingDates,
  checkBookingPermission,
  canGuestCancelBooking,
  getGuestRefundPolicyEligibility,
  getBookingWithPopulate,
  getBookingById: getBookingByIdCore,
  refreshRoomBookingStatus
} = require("./core");
const { isGuestBookableHotelStatus } = require("../../utils/hotelStatus");
const {
  computeStaySalePricing,
  computeStaySalePricingFromSales,
  loadSalesOverlappingStay,
} = require("../sale/salePricingService");
const { resolveEffectiveQrConfig } = require("../../utils/paymentQrConfig");
const { isVnpayConfigComplete } = require("../../utils/hotelPaymentConfig");

const sanitizeGuestHotelPaymentConfig = (hotel) => {
  if (!hotel) return hotel;
  const hotelObj = hotel.toObject ? hotel.toObject() : { ...hotel };
  hotelObj.paymentConfig = hotelObj.paymentConfig || {};
  const effectiveQr = resolveEffectiveQrConfig(hotelObj.paymentConfig?.qr || {});
  hotelObj.paymentConfig.qr = {
    ...effectiveQr
  };
  if (hotelObj.paymentConfig?.vnpay) {
    const vnpay = hotelObj.paymentConfig.vnpay;
    hotelObj.paymentConfig.vnpay = {
      ...vnpay,
      isConfigured: isVnpayConfigComplete(vnpay)
    };
    delete hotelObj.paymentConfig.vnpay.secureSecret;
  }
  return hotelObj;
};

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

  const hotel = await Hotel.findById(hotelId).select("+paymentConfig");
  if (!hotel) {
    throw new Error("Không tìm thấy khách sạn");
  }

  if (!isGuestBookableHotelStatus(hotel.status)) {
    const err = new Error("Khách sạn hiện không nhận đặt phòng mới.");
    err.statusCode = 400;
    throw err;
  }

  const dateValidation = validateBookingDates(checkInDate, checkOutDate);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.error);
  }

  // Check if room exists
  const room = await Room.findById(roomId);
  if (!room) {
    throw new Error("Không tìm thấy phòng");
  }

  // Verify room belongs to the hotel (Security check)
  if (room.hotelId.toString() !== hotelId) {
    throw new Error("Phòng không thuộc về khách sạn đã chọn");
  }

  // Check room availability (includes room status, booking status, and date conflicts)
  const isAvailable = await checkRoomAvailability(room, checkInDate, checkOutDate);
  if (!isAvailable) {
    throw new Error("Phòng không khả dụng cho đặt chỗ");
  }

  // Tính tiền và snapshot ở server (không tin totalAmount từ client)
  const pricing = await computeStaySalePricing(room, hotelId, checkInDate, checkOutDate);
  const calculatedAmount = pricing.finalAmount;

  const method = paymentMethod || "qr_code";
  if (method === "qr_code") {
    const qr = resolveEffectiveQrConfig(hotel.paymentConfig?.qr || {});
    if (!qr.isConfigured) {
      const err = new Error(
        "Khách sạn chưa cấu hình đủ thanh toán QR (tên chủ TK, số TK, ngân hàng và ảnh mã QR). Vui lòng chọn VNPay hoặc liên hệ khách sạn."
      );
      err.statusCode = 400;
      throw err;
    }
  }
  // Với VNPay, kiểm tra merchant config ở bước tạo payment URL để tránh false-negative.

  // Create new booking
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

  // Save booking to database
  const savedBooking = await newBooking.save();

  // Update room bookingStatus based on today's bookings (pending/empty/occupied)
  await refreshRoomBookingStatus(roomId);

  // Return populated booking
  const booking = await getBookingWithPopulate(savedBooking._id, {
    hotel: `name address images starRating ${Hotel.PAYMENT_CONFIG_SELECT}`,
    room: "roomNumber type price images"
  });
  if (booking?.hotel) {
    booking.hotel = sanitizeGuestHotelPaymentConfig(booking.hotel);
  }
  return booking;
};

/**
 * Xem trước giá (guest) — cùng logic với tạo đặt phòng
 */
const previewBookingPrice = async (hotelId, roomId, checkInDate, checkOutDate) => {
  const hotel = await Hotel.findById(hotelId).select("+paymentConfig");
  if (!hotel) {
    throw new Error("Không tìm thấy khách sạn");
  }
  const dateValidation = validateBookingDates(checkInDate, checkOutDate);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.error);
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
      select: `name address images starRating policies ${Hotel.PAYMENT_CONFIG_SELECT}`
    })
    .populate({
      path: "room",
      select: "roomNumber type price images"
    })
    .sort({ createdAt: -1 });

  return bookings.map((booking) => {
    const bookingObj = booking.toObject ? booking.toObject() : { ...booking };
    bookingObj.hotel = sanitizeGuestHotelPaymentConfig(bookingObj.hotel);
    return bookingObj;
  });
};

/**
 * Get booking by ID (with permission check for guest)
 * @param {String} bookingId - Booking ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Booking object
 */
const getBookingById = async (bookingId, user) => {
  const booking = await getBookingByIdCore(bookingId, user, {
    hotel: `name address images starRating contactInfo policies ${Hotel.PAYMENT_CONFIG_SELECT}`,
    room: "roomNumber type price images maxPeople description facilities"
  });
  if (booking?.hotel) {
    booking.hotel = sanitizeGuestHotelPaymentConfig(booking.hotel);
  }
  return booking;
};

/**
 * Get available rooms for a hotel by date range
 * @param {String} hotelId - Hotel ID
 * @param {Date|String} checkInDate - Check-in date
 * @param {Date|String} checkOutDate - Check-out date
 * @returns {Promise<Array>} Array of available rooms
 */
const getAvailableRooms = async (hotelId, checkInDate, checkOutDate) => {
  const dateValidation = validateBookingDates(checkInDate, checkOutDate);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.error);
  }
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new Error("Không tìm thấy khách sạn");
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
        nightBreakdown: pricing.nightBreakdown,
        salePeriods: pricing.salePeriods,
        nightsOnSale: pricing.nightsOnSale,
        nightsRegularPrice: pricing.nightsRegularPrice,
        mixedSalePricing: pricing.mixedSalePricing,
      };
      availableRooms.push(roomObj);
    }
  }

  return availableRooms;
};

const trimStr = (v) => String(v ?? "").trim();

/**
 * Cancel a booking (guest)
 * @param {String} bookingId
 * @param {Object} payload - cancellationReason, refundBankAccountName, refundBankAccountNumber, refundBankName
 * @param {Object} user
 */
const cancelBooking = async (bookingId, payload, user) => {
  const cancellationReason = trimStr(payload?.cancellationReason);
  const booking = await Booking.findById(bookingId).populate("hotel");

  if (!booking) {
    throw new Error("Không tìm thấy đơn đặt phòng");
  }

  if (!checkBookingPermission(booking, user)) {
    throw new Error("Bạn không có quyền hủy đơn đặt phòng này");
  }

  const cancelValidation = canGuestCancelBooking(booking);
  if (!cancelValidation.canCancel) {
    throw new Error(cancelValidation.error);
  }

  const previousPaymentStatus = booking.paymentStatus;
  const refundEligibility = getGuestRefundPolicyEligibility(booking);
  const bankName = trimStr(payload?.refundBankAccountName);
  const bankNumber = trimStr(payload?.refundBankAccountNumber);
  const bankBranch = trimStr(payload?.refundBankName);

  if (previousPaymentStatus === "paid" && refundEligibility.eligible) {
    if (!bankName || !bankNumber || !bankBranch) {
      const err = new Error(
        "Vui lòng nhập đầy đủ tên chủ tài khoản, số tài khoản và tên ngân hàng để nhận hoàn tiền."
      );
      err.statusCode = 400;
      throw err;
    }
  }

  const now = new Date();
  const update = {
    paymentStatus: "cancelled",
    cancellationReason: cancellationReason || "Khách hủy đặt phòng",
    guestCancelRequestedAt: now,
    guestCancelSnapshot: {
      wasPaid: previousPaymentStatus === "paid",
      paymentMethod: booking.paymentMethod,
      refundPolicyEligible: Boolean(refundEligibility.eligible && previousPaymentStatus === "paid")
    }
  };

  if (previousPaymentStatus === "paid" && refundEligibility.eligible) {
    update.guestRefundBankAccountName = bankName;
    update.guestRefundBankAccountNumber = bankNumber;
    update.guestRefundBankName = bankBranch;
  } else {
    update.guestRefundBankAccountName = null;
    update.guestRefundBankAccountNumber = null;
    update.guestRefundBankName = null;
  }

  await Booking.findByIdAndUpdate(bookingId, update, { new: true });

  // Giữ PaymentTransaction ở trạng thái "success" để đối soát / lịch sử giao dịch.
  // Việc hủy đơn và hoàn tiền biểu diễn qua Booking (paymentStatus cancelled,
  // guestCancelSnapshot, guestRefundBank*, ownerRefundCompletedAt).

  await refreshRoomBookingStatus(booking.room);

  const populated = await getBookingWithPopulate(bookingId, {
    hotel: `name address images starRating contactInfo policies ${Hotel.PAYMENT_CONFIG_SELECT}`,
    room: "roomNumber type price images maxPeople description facilities",
    guest: "name email phone"
  });
  if (populated?.hotel) {
    populated.hotel = sanitizeGuestHotelPaymentConfig(populated.hotel);
  }
  return populated;
};

module.exports = {
  createBooking,
  getMyBookings,
  getBookingById,
  getAvailableRooms,
  cancelBooking,
  previewBookingPrice,
};