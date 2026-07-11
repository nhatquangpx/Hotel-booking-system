const mongoose = require("mongoose");
const Booking = require("../../models/Booking");
const Room = require("../../models/Room");
const Hotel = require("../../models/Hotel");
const User = require("../../models/User");
const {
  checkRoomAvailability,
  analyzeRoomStayAvailability,
  validateBookingDates,
  checkBookingPermission,
  canGuestCancelBooking,
  getGuestRefundPolicyEligibility,
  isBookingEffectivelyPaid,
  getBookingWithPopulate,
  getBookingById: getBookingByIdCore,
  refreshRoomBookingStatus,
} = require("./core");
const { reserveRoomBooking } = require("./reserveRoom");
const { computePendingExpiresAt } = require("../../lib/booking/pendingHoldConfig");
const { isGuestBookableHotelStatus } = require("../../services/hotels/status");
const { cancelExpiredPendingBookings } = require("./pendingExpiry");
const { readRoomPrice } = require("../rooms/roomPrice");
const {
  computeStaySalePricing,
  computeStaySalePricingFromSales,
  loadSalesOverlappingStay,
} = require("../sale/salePricingService");
const { resolveEffectiveQrConfig } = require("../../services/payments/qrConfig");
const { isVnpayConfigComplete } = require("../../services/hotels/paymentConfig");
const { resolveAndPriceAddons } = require("../addon/addonPricing");
const { hasSensitiveMedia } = require("../media/sensitiveMedia");

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
  const {
    hotelId,
    roomId,
    checkInDate,
    checkOutDate,
    paymentMethod,
    specialRequests,
    guestCount,
    selectedAddonIds,
    guestIdNumber,
    guestIdImageFrontUrl,
    guestIdImageBackUrl,
  } = bookingData;

  const parsedGuestCount = Number(guestCount);
  if (!Number.isFinite(parsedGuestCount) || parsedGuestCount < 1) {
    const err = new Error("Số khách phải từ 1 trở lên");
    err.statusCode = 400;
    throw err;
  }

  const normalizedIdNumber = String(guestIdNumber || "").replace(/\s+/g, "").trim();
  if (!/^\d{9}$|^\d{12}$/.test(normalizedIdNumber)) {
    const err = new Error("Số CCCD/CMND không hợp lệ (9 hoặc 12 chữ số)");
    err.statusCode = 400;
    throw err;
  }

  const guestUser = await User.findById(guestId).select(
    "idNumber idImageFrontUrl idImageBackUrl"
  );
  let resolvedFront = guestIdImageFrontUrl || undefined;
  let resolvedBack = guestIdImageBackUrl || undefined;
  if (!resolvedFront && hasSensitiveMedia(guestUser?.idImageFrontUrl)) {
    resolvedFront = guestUser.idImageFrontUrl;
  }
  if (!resolvedBack && hasSensitiveMedia(guestUser?.idImageBackUrl)) {
    resolvedBack = guestUser.idImageBackUrl;
  }
  if (!hasSensitiveMedia(resolvedFront) || !hasSensitiveMedia(resolvedBack)) {
    const err = new Error(
      "Vui lòng tải đủ ảnh CCCD mặt trước và mặt sau (ảnh đã có trên hồ sơ được dùng nếu không chọn lại)"
    );
    err.statusCode = 400;
    throw err;
  }

  await cancelExpiredPendingBookings();

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

  if (parsedGuestCount > room.maxPeople) {
    const err = new Error(
      `Số khách (${parsedGuestCount}) vượt quá sức chứa tối đa của phòng (${room.maxPeople} người)`
    );
    err.statusCode = 400;
    throw err;
  }

  // Kiểm tra nhanh trước khi tính giá (tránh tính toán không cần thiết).
  const isAvailable = await checkRoomAvailability(room, checkInDate, checkOutDate);
  if (!isAvailable) {
    const err = new Error("Phòng không khả dụng cho đặt chỗ");
    err.statusCode = 400;
    throw err;
  }

  const pricing = await computeStaySalePricing(room, hotelId, checkInDate, checkOutDate);
  const { selectedAddons, addonsAmount } = await resolveAndPriceAddons({
    hotelId,
    selectedAddonIds: selectedAddonIds || [],
    checkInDate,
    checkOutDate,
    guestCount: parsedGuestCount,
  });
  const finalAmount = pricing.finalAmount + addonsAmount;

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

  const savedBooking = await reserveRoomBooking({
    roomId,
    bookingDoc: {
      guest: guestId,
      hotel: hotelId,
      room: roomId,
      checkInDate: new Date(checkInDate),
      checkOutDate: new Date(checkOutDate),
      guestCount: parsedGuestCount,
      guestIdNumber: normalizedIdNumber,
      guestIdImageFrontUrl: resolvedFront || undefined,
      guestIdImageBackUrl: resolvedBack || undefined,
      selectedAddons,
      addonsAmount,
      finalAmount,
      basePrice: pricing.basePrice,
      discountAmount: pricing.discountAmount,
      promotionApplied: pricing.promotionApplied || undefined,
      paymentMethod: method,
      specialRequests: specialRequests || "",
      cancellationReason: "",
      paymentStatus: "pending",
      pendingExpiresAt: computePendingExpiresAt(),
    },
  });

  // Đồng bộ CCCD vào profile guest (snapshot đơn vẫn giữ trên Booking)
  const profileSync = { idNumber: normalizedIdNumber };
  if (resolvedFront) profileSync.idImageFrontUrl = resolvedFront;
  if (resolvedBack) profileSync.idImageBackUrl = resolvedBack;
  await User.findByIdAndUpdate(guestId, profileSync);

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
const previewBookingPrice = async (
  hotelId,
  roomId,
  checkInDate,
  checkOutDate,
  { guestCount = 1, selectedAddonIds = [] } = {}
) => {
  const parsedGuestCount = Number(guestCount);
  if (!Number.isFinite(parsedGuestCount) || parsedGuestCount < 1) {
    throw new Error("Số khách phải từ 1 trở lên");
  }
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

  if (parsedGuestCount > room.maxPeople) {
    const err = new Error(
      `Số khách (${parsedGuestCount}) vượt quá sức chứa tối đa của phòng (${room.maxPeople} người)`
    );
    err.statusCode = 400;
    throw err;
  }

  const pricing = await computeStaySalePricing(room, hotelId, checkInDate, checkOutDate);
  const { selectedAddons, addonsAmount } = await resolveAndPriceAddons({
    hotelId,
    selectedAddonIds,
    checkInDate,
    checkOutDate,
    guestCount: parsedGuestCount,
  });

  return {
    hotelId,
    roomId,
    checkInDate,
    checkOutDate,
    guestCount: parsedGuestCount,
    selectedAddons,
    addonsAmount,
    ...pricing,
    roomAmount: pricing.finalAmount,
    finalAmount: pricing.finalAmount + addonsAmount,
  };
};

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

const GUEST_BOOKING_POPULATE = [
  {
    path: "hotel",
    select: `name address images starRating policies ${Hotel.PAYMENT_CONFIG_SELECT}`,
  },
  {
    path: "room",
    select: "roomNumber type price images",
  },
];

function mapGuestBookingRow(booking) {
  const bookingObj = booking.toObject ? booking.toObject() : { ...booking };
  bookingObj.hotel = sanitizeGuestHotelPaymentConfig(bookingObj.hotel);
  return bookingObj;
}

async function getGuestFilterHotels(guestId) {
  const guestOid = new mongoose.Types.ObjectId(String(guestId));
  const rows = await Booking.aggregate([
    { $match: { guest: guestOid } },
    { $group: { _id: "$hotel" } },
  ]);
  const hotelIds = rows.map((r) => r._id).filter(Boolean);
  if (!hotelIds.length) return [];
  return Hotel.find({ _id: { $in: hotelIds } })
    .select("name")
    .sort({ name: 1 })
    .lean();
}

/**
 * Danh sách đặt phòng của khách (lọc + phân trang).
 * @param {String} guestId
 * @param {{ hotelId?: string, startDate?: string, endDate?: string, page?: number, limit?: number }} options
 */
const getMyBookings = async (guestId, options = {}) => {
  const { hotelId, startDate, endDate, page, limit } = options;
  const {
    parsePaginationQuery,
    buildPaginationMeta,
    paginatedBody,
  } = require("../../lib/http/pagination");

  await cancelExpiredPendingBookings();

  const query = { guest: guestId };
  if (hotelId && mongoose.isValidObjectId(String(hotelId))) {
    query.hotel = hotelId;
  }
  if (startDate) {
    query.checkInDate = { ...(query.checkInDate || {}), $gte: startOfDay(startDate) };
  }
  if (endDate) {
    query.checkInDate = { ...(query.checkInDate || {}), $lte: endOfDay(endDate) };
  }

  const pag = parsePaginationQuery({ page, limit }, { defaultLimit: 10, maxLimit: 50 });
  const filterHotels = await getGuestFilterHotels(guestId);

  const [bookings, total] = await Promise.all([
    Booking.find(query)
      .populate(GUEST_BOOKING_POPULATE)
      .sort({ createdAt: -1 })
      .skip(pag.skip)
      .limit(pag.limit),
    Booking.countDocuments(query),
  ]);

  const body = paginatedBody(
    bookings.map(mapGuestBookingRow),
    buildPaginationMeta({ page: pag.page, limit: pag.limit, total }),
    "bookings"
  );
  body.filterHotels = filterHotels;
  return body;
};

/**
 * Get booking by ID (with permission check for guest)
 * @param {String} bookingId - Booking ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Booking object
 */
const getBookingById = async (bookingId, user) => {
  await cancelExpiredPendingBookings();

  const booking = await getBookingByIdCore(bookingId, user, {
    hotel: `name address images starRating contactInfo policies ${Hotel.PAYMENT_CONFIG_SELECT}`,
    room: "roomNumber type price images maxPeople description facilities"
  });
  if (booking?.hotel) {
    booking.hotel = sanitizeGuestHotelPaymentConfig(booking.hotel);
  }
  return booking;
};

const buildSalePricingPayload = (room, pricing) => ({
  basePrice: pricing.basePrice,
  finalAmount: pricing.finalAmount,
  discountAmount: pricing.discountAmount,
  displayPercentOff: pricing.displayPercentOff,
  promotionTitle: pricing.promotionApplied?.title || null,
  nightlyBase: pricing.nightlyBase,
  finalNightly: pricing.finalNightly,
  nights: pricing.nights,
  regularNightly: readRoomPrice(room.price),
  nightBreakdown: pricing.nightBreakdown,
  salePeriods: pricing.salePeriods,
  nightsOnSale: pricing.nightsOnSale,
  nightsRegularPrice: pricing.nightsRegularPrice,
  mixedSalePricing: pricing.mixedSalePricing,
});

/**
 * Get available rooms for a hotel by date range.
 * Phòng trống cả kỳ + phòng chỉ trống một phần (gợi ý khoảng ngày còn trống).
 * Phòng bị chiếm toàn bộ kỳ sẽ không trả về.
 * @param {String} hotelId - Hotel ID
 * @param {Date|String} checkInDate - Check-in date
 * @param {Date|String} checkOutDate - Check-out date
 * @returns {Promise<Array>} Array of available / partially available rooms
 */
const getAvailableRooms = async (hotelId, checkInDate, checkOutDate) => {
  await cancelExpiredPendingBookings();

  const dateValidation = validateBookingDates(checkInDate, checkOutDate);
  if (!dateValidation.valid) {
    throw new Error(dateValidation.error);
  }
  const hotel = await Hotel.findById(hotelId);
  if (!hotel) {
    throw new Error("Không tìm thấy khách sạn");
  }

  const allRooms = await Room.find({ hotelId: hotelId });
  const startDate = new Date(checkInDate);
  const endDate = new Date(checkOutDate);
  const availableRooms = [];
  const sales = await loadSalesOverlappingStay(hotelId, checkInDate, checkOutDate);

  for (const room of allRooms) {
    const analysis = await analyzeRoomStayAvailability(room, startDate, endDate);
    if (analysis.status === "unavailable") continue;

    const priceCheckIn =
      analysis.status === "partial" ? analysis.suggestion.checkInDate : checkInDate;
    const priceCheckOut =
      analysis.status === "partial" ? analysis.suggestion.checkOutDate : checkOutDate;

    const pricing = computeStaySalePricingFromSales(
      room,
      priceCheckIn,
      priceCheckOut,
      sales
    );

    const roomObj = room.toObject ? room.toObject() : { ...room };
    roomObj.salePricing = buildSalePricingPayload(room, pricing);
    roomObj.availability = {
      status: analysis.status,
      blockedNights: analysis.blockedNights,
      freeRanges: analysis.freeRanges,
      suggestion: analysis.suggestion,
      requestedCheckInDate: checkInDate,
      requestedCheckOutDate: checkOutDate,
    };
    availableRooms.push(roomObj);
  }

  availableRooms.sort((a, b) => {
    if (a.availability.status !== b.availability.status) {
      return a.availability.status === "available" ? -1 : 1;
    }
    return 0;
  });

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

  const effectivelyPaid = isBookingEffectivelyPaid(booking);
  const refundEligibility = getGuestRefundPolicyEligibility(booking);
  const bankName = trimStr(payload?.refundBankAccountName);
  const bankNumber = trimStr(payload?.refundBankAccountNumber);
  const bankBranch = trimStr(payload?.refundBankName);

  if (effectivelyPaid && refundEligibility.eligible) {
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
      wasPaid: effectivelyPaid,
      paymentMethod: booking.paymentMethod,
      refundPolicyEligible: Boolean(refundEligibility.eligible && effectivelyPaid)
    }
  };

  if (effectivelyPaid && refundEligibility.eligible) {
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