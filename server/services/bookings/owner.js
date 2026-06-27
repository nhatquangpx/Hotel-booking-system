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
const { notifyGuestRefundProcessed, notifyGuestQrPaymentRejected, notifyGuestQrProofResubmitRequired } = require("../notifications/guest");
const { sendRefundProcessedEmail, sendQrPaymentRejectedEmail, sendQrProofResubmitEmail } = require("../emails");
const { getQrRejectionMessage } = require("./qrPaymentRejection");
const { getBookingFinalAmount } = require("./bookingAmount");

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
const getBookingsByOwner = async (ownerId, hotelId, options = {}) => {
  const {
    page,
    limit,
    all,
    view = "all",
    showPastBookings,
    statusFilter,
    methodFilter,
    proofFilter,
    search,
  } = options;

  const hotelIds = await getScopedHotelIdsForOwner(ownerId, hotelId || null);
  if (hotelIds.length === 0) {
    if (all === true || all === "true") return [];
    return paginatedBody([], buildPaginationMeta({ page: 1, limit: limit || 12, total: 0 }), "bookings");
  }

  const {
    parsePaginationQuery,
    buildPaginationMeta,
    paginatedBody,
  } = require("../../lib/http/pagination");
  const {
    BOOKING_POPULATE,
    buildOwnerBookingFilterQuery,
    buildOwnerActionBookingQuery,
  } = require("./listQuery");
  const User = require("../../models/User");

  const baseQuery = { hotel: { $in: hotelIds } };
  const conditions = [baseQuery];

  if (view === "action") {
    conditions.push(buildOwnerActionBookingQuery());
  } else {
    const filterQuery = buildOwnerBookingFilterQuery({
      showPastBookings,
      statusFilter,
      methodFilter,
      proofFilter,
    });
    if (Object.keys(filterQuery).length) conditions.push(filterQuery);
  }

  const q = String(search || "").trim();
  if (q) {
    const regex = { $regex: require("../../lib/http/pagination").escapeRegex(q), $options: "i" };
    const guests = await User.find({
      $or: [{ name: regex }, { phone: regex }],
    }).select("_id");
    const guestIds = guests.map((g) => g._id);
    const searchConditions = [{ _id: regex }];
    if (guestIds.length) searchConditions.push({ guest: { $in: guestIds } });
    conditions.push({ $or: searchConditions });
  }

  const mongoQuery = conditions.length > 1 ? { $and: conditions } : baseQuery;
  const pag = parsePaginationQuery({ page, limit, all }, { defaultLimit: 12, maxLimit: 100 });

  if (pag.all) {
    return Booking.find(mongoQuery)
      .populate(BOOKING_POPULATE)
      .sort({ createdAt: -1 });
  }

  const [bookings, total] = await Promise.all([
    Booking.find(mongoQuery)
      .populate(BOOKING_POPULATE)
      .sort({ createdAt: -1 })
      .skip(pag.skip)
      .limit(pag.limit),
    Booking.countDocuments(mongoQuery),
  ]);

  return paginatedBody(
    bookings,
    buildPaginationMeta({ page: pag.page, limit: pag.limit, total }),
    "bookings"
  );
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
  if (status === "paid") {
    booking.pendingExpiresAt = undefined;
  }
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

  const amount = getBookingFinalAmount(booking);
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

/**
 * Chủ KS xử lý minh chứng QR không đạt:
 * - invalid_proof: yêu cầu khách tải lại minh chứng (đơn vẫn pending)
 * - payment_not_successful: hủy đơn, khách cần đặt lại
 */
const rejectQrPayment = async (bookingId, user, rejectionType) => {
  const type = String(rejectionType || "").trim();
  const reason = getQrRejectionMessage(type);
  if (!reason) {
    const err = new Error("Loại từ chối không hợp lệ.");
    err.statusCode = 400;
    throw err;
  }

  const booking = await Booking.findById(bookingId).populate({
    path: "hotel",
    select: "ownerId name"
  });

  if (!booking) {
    throw new Error("Đơn đặt phòng không tồn tại");
  }

  if (!checkBookingPermission(booking, user)) {
    throw new Error("Bạn không có quyền thực hiện thao tác này");
  }

  if (booking.paymentMethod !== "qr_code") {
    throw new Error("Chỉ áp dụng cho đơn thanh toán QR.");
  }

  if (booking.paymentStatus !== "pending") {
    throw new Error("Chỉ có thể xử lý đơn đang chờ xác nhận thanh toán.");
  }

  if (!booking.qrPaymentReportedAt) {
    throw new Error("Khách chưa gửi minh chứng chuyển khoản.");
  }

  const latestTransaction = await PaymentTransaction.findOne({
    booking: booking._id,
    paymentMethod: "qr_code"
  }).sort({ createdAt: -1 });

  booking.ownerPaymentRejectionReason = reason;
  booking.ownerQrRejectionType = type;

  if (type === "invalid_proof") {
    booking.qrPaymentReportedAt = undefined;
    booking.qrPaymentProofUrl = undefined;
    await booking.save();

    if (latestTransaction) {
      latestTransaction.status = "cancelled";
      latestTransaction.errorMessage = reason;
      await latestTransaction.save();
    }

    notifyGuestQrProofResubmitRequired(booking._id).catch((err) =>
      console.error("Lỗi khi gửi thông báo yêu cầu tải lại minh chứng QR:", err)
    );

    const populated = await getBookingById(bookingId, user);
    sendQrProofResubmitEmail(populated).catch((err) =>
      console.error("Lỗi khi gửi email yêu cầu tải lại minh chứng QR:", err)
    );

    return populated;
  }

  // payment_not_successful → hủy đơn
  booking.paymentStatus = "cancelled";
  await booking.save();

  if (latestTransaction) {
    latestTransaction.status = "cancelled";
    latestTransaction.errorMessage = reason;
    await latestTransaction.save();
  }

  if (booking.room) {
    await refreshRoomBookingStatus(booking.room);
  }

  notifyGuestQrPaymentRejected(booking._id).catch((err) =>
    console.error("Lỗi khi gửi thông báo từ chối minh chứng QR cho khách:", err)
  );

  const populated = await getBookingById(bookingId, user);
  sendQrPaymentRejectedEmail(populated).catch((err) =>
    console.error("Lỗi khi gửi email từ chối minh chứng QR cho khách:", err)
  );

  return populated;
};

module.exports = {
  getBookingsByOwner,
  getBookingsByRoomForOwner,
  getBookingById,
  updateBookingStatus,
  confirmGuestRefund,
  rejectQrPayment,
  checkIn,
  checkOut
};