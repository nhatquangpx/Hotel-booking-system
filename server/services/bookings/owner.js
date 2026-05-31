const Booking = require("../../models/Booking");
const Hotel = require("../../models/Hotel");
const Room = require("../../models/Room");
const PaymentTransaction = require("../../models/PaymentTransaction");
const { getScopedHotelIdsForOwner } = require("../dashboards/core");
const {
  checkBookingPermission,
  getBookingById: getBookingByIdCore,
  refreshRoomBookingStatus,
} = require("./core");
const { checkInBooking, checkOutBooking } = require("./hotelTeam");
const { notifyGuestRefundProcessed } = require("../notifications/guest");
const { sendRefundProcessedEmail } = require("../emails");

const resolveProofImageUrl = (file) => {
  if (!file) return "";

  const candidate = file.path || file.secure_url || file.url || "";
  if (/^https?:\/\//i.test(candidate)) {
    return candidate;
  }

  if (file.filename) {
    return `/uploads/payment-proofs/${file.filename}`;
  }

  const normalizedPath = String(candidate).replace(/\\/g, "/");
  const uploadsIndex = normalizedPath.lastIndexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return normalizedPath.slice(uploadsIndex);
  }

  return "";
};

const toPublicUrl = (relativeOrAbsoluteUrl) => {
  if (!relativeOrAbsoluteUrl) return "";
  if (/^https?:\/\//i.test(relativeOrAbsoluteUrl)) return relativeOrAbsoluteUrl;
  const backendBase = process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000";
  const normalizedBase = String(backendBase).replace(/\/+$/, "");
  const normalizedPath = relativeOrAbsoluteUrl.startsWith("/")
    ? relativeOrAbsoluteUrl
    : `/${relativeOrAbsoluteUrl}`;
  return `${normalizedBase}${normalizedPath}`;
};

/**
 * Owner Booking Service
 * All booking operations specific to owner role
 */

/**
 * Get all bookings for owner's hotels
 * @param {String} ownerId - Owner user ID
 * @returns {Promise<Array>} Array of bookings
 */
const getBookingsByOwner = async (ownerId, hotelId) => {
  const hotelIds = await getScopedHotelIdsForOwner(ownerId, hotelId || null);

  if (hotelIds.length === 0) {
    return [];
  }

  const bookings = await Booking.find({ hotel: { $in: hotelIds } })
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

  return bookings;
};

/**
 * Lịch sử đặt phòng theo room (owner — phòng thuộc KS của chủ).
 */
const getBookingsByRoomForOwner = async (ownerId, roomId) => {
  const room = await Room.findById(roomId).select("hotelId roomNumber");
  if (!room) {
    const err = new Error("Không tìm thấy phòng");
    err.statusCode = 404;
    throw err;
  }

  const hotel = await Hotel.findOne({ _id: room.hotelId, ownerId }).select("_id name");
  if (!hotel) {
    const err = new Error("Bạn không có quyền xem lịch sử phòng này");
    err.statusCode = 403;
    throw err;
  }

  return Booking.find({ room: roomId })
    .populate({ path: "guest", select: "name email phone" })
    .populate({ path: "hotel", select: "name" })
    .populate({ path: "room", select: "roomNumber type" })
    .sort({ checkInDate: -1, createdAt: -1 })
    .lean();
};

/**
 * Get booking by ID (with permission check for owner)
 * @param {String} bookingId - Booking ID
 * @param {Object} user - User object
 * @returns {Promise<Object>} Booking object
 */
const getBookingById = async (bookingId, user) => {
  return await getBookingByIdCore(bookingId, user, {
    hotel: "name address images starRating contactInfo policies ownerId +paymentConfig",
    room: "roomNumber type price images maxPeople description facilities",
    guest: "name email phone"
  });
};

/**
 * Update booking status (owner can update bookings for their hotels)
 * @param {String} bookingId - Booking ID
 * @param {String} status - New status
 * @param {Object} user - User object
 * @returns {Promise<Object>} Updated booking
 */
const updateBookingStatus = async (bookingId, status, user) => {
  // Find booking and populate hotel to check permission
  const booking = await Booking.findById(bookingId).populate({
    path: "hotel",
    select: "ownerId"
  });

  if (!booking) {
    throw new Error("Đơn đặt phòng không tồn tại");
  }

  // Check permission (owner can only update bookings for their hotels)
  if (!checkBookingPermission(booking, user)) {
    throw new Error("Bạn không có quyền thực hiện thao tác này");
  }

  // Validate status
  const validStatuses = ["pending", "paid", "cancelled"];
  if (!validStatuses.includes(status)) {
    throw new Error("Trạng thái không hợp lệ");
  }

  if (
    status === "paid" &&
    booking.paymentMethod === "qr_code" &&
    !booking.qrPaymentProofUrl
  ) {
    throw new Error("Đơn QR chưa có minh chứng chuyển khoản, không thể xác nhận đã thanh toán");
  }

  const previousPaymentStatus = booking.paymentStatus;

  if (status === "cancelled" && previousPaymentStatus === "paid") {
    throw new Error(
      "Không thể hủy đơn đã thanh toán từ trang chủ khách sạn. Khách cần gửi hủy đơn trong tài khoản của họ; sau đó bạn dùng nút xác nhận hoàn tiền trên đơn đã hủy."
    );
  }

  booking.paymentStatus = status;
  await booking.save();

  if (status === "paid") {
    const latestTransaction = await PaymentTransaction.findOne({
      booking: booking._id,
      paymentMethod: booking.paymentMethod
    }).sort({ createdAt: -1 });

    if (latestTransaction) {
      latestTransaction.status = "success";
      latestTransaction.errorMessage = undefined;
      await latestTransaction.save();
    }
  } else if (status === "cancelled" && previousPaymentStatus !== "paid") {
    // Chỉ cập nhật transaction khi hủy đơn chưa thanh toán — không ghi đè success của lần thanh toán đã thành công
    const latestTransaction = await PaymentTransaction.findOne({
      booking: booking._id,
      paymentMethod: booking.paymentMethod
    }).sort({ createdAt: -1 });

    if (latestTransaction) {
      latestTransaction.status = "cancelled";
      await latestTransaction.save();
    }
  }

  // Refresh room bookingStatus (in case status change affects occupancy state)
  if (booking.room) {
    await refreshRoomBookingStatus(booking.room);
  }

  return booking;
};

/** Check-in / check-out — logic chung với staff (hotelTeam). */
const checkIn = checkInBooking;
const checkOut = checkOutBooking;

/**
 * Chủ KS xác nhận đã hoàn tiền cho đơn khách đã hủy (đã thanh toán + đủ điều kiện hoàn theo chính sách).
 */
const confirmGuestRefund = async (bookingId, user, refundProofFile) => {
  const booking = await Booking.findById(bookingId).populate({
    path: "hotel",
    select: "ownerId"
  });

  if (!booking) {
    throw new Error("Đơn đặt phòng không tồn tại");
  }

  if (!checkBookingPermission(booking, user)) {
    throw new Error("Bạn không có quyền thực hiện thao tác này");
  }

  if (booking.paymentStatus !== "cancelled") {
    throw new Error("Chỉ xác nhận hoàn tiền cho đơn đã được khách hủy.");
  }

  if (!booking.guestCancelRequestedAt) {
    throw new Error("Khách chưa gửi yêu cầu hủy đặt phòng trên hệ thống.");
  }

  if (!booking.guestCancelSnapshot?.wasPaid || !booking.guestCancelSnapshot?.refundPolicyEligible) {
    throw new Error("Đơn này không thuộc diện cần hoàn tiền theo quy định.");
  }

  if (booking.ownerRefundCompletedAt) {
    throw new Error("Đã xác nhận hoàn tiền cho đơn này trước đó.");
  }

  const refundProofUrl = resolveProofImageUrl(refundProofFile);
  if (!refundProofUrl) {
    const err = new Error("Vui lòng tải lên ảnh minh chứng hoàn tiền trước khi xác nhận.");
    err.statusCode = 400;
    throw err;
  }

  booking.ownerRefundCompletedAt = new Date();
  booking.ownerRefundProofUrl = refundProofUrl;
  await booking.save();

  const amount = Number(booking.finalAmount ?? booking.totalAmount ?? 0);
  notifyGuestRefundProcessed(booking._id, amount, 100).catch((err) =>
    console.error("Lỗi khi gửi thông báo hoàn tiền cho khách:", err)
  );
  const populated = await getBookingById(bookingId, user);
  const proofPublicUrl = toPublicUrl(populated.ownerRefundProofUrl || refundProofUrl);
  sendRefundProcessedEmail(populated, proofPublicUrl).catch((err) =>
    console.error("Lỗi khi gửi email hoàn tiền cho khách:", err)
  );

  return populated;
};

module.exports = {
  getBookingsByOwner,
  getBookingsByRoomForOwner,
  getBookingById,
  updateBookingStatus,
  confirmGuestRefund,
  checkIn,
  checkOut
};