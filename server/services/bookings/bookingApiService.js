const Review = require("../../models/Review");
const Booking = require("../../models/Booking");
const {
  notifyBookingCancelled,
  notifyCheckIn,
  notifyCheckOut,
  notifyPaymentSuccessful,
  notifyGuestBookingConfirmed,
  notifyGuestBookingCancelled,
  notifyGuestBookingReopened,
  notifyAdminHighValueBooking,
} = require("../notifications");
const { sendReceiptEmail, sendCheckInReminderIfNeeded } = require("../emails");
const bookingService = require("./index");
const { ServiceError } = require("../../lib/http/serviceError");
const { getBookingFinalAmount } = require("./bookingAmount");

function sanitizeBookingForResponse(booking) {
  const bookingObj = booking.toObject ? booking.toObject() : { ...booking };
  if (bookingObj.hotel?.paymentConfig?.vnpay) {
    delete bookingObj.hotel.paymentConfig.vnpay.secureSecret;
  }
  return bookingObj;
}

async function attachReviewToBooking(booking) {
  const review = await Review.findOne({ booking: booking._id }).populate({
    path: "guest",
    select: "name email",
  });
  const bookingObj = sanitizeBookingForResponse(booking);
  if (review) bookingObj.review = review;
  return bookingObj;
}

async function getBookingByIdForUser({ id, user }) {
  let booking;
  if (user.role === "admin") {
    booking = await bookingService.getAdminBookingById(id, user);
  } else if (user.role === "owner") {
    booking = await bookingService.getOwnerBookingById(id, user);
  } else {
    booking = await bookingService.getGuestBookingById(id, user);
  }
  return { status: 200, body: await attachReviewToBooking(booking) };
}

async function getStaffBookingByIdWithReview({ id, user }) {
  const booking = await bookingService.getStaffBookingById(id, user);
  return { status: 200, body: await attachReviewToBooking(booking) };
}

async function createBooking({ bookingData, userId }) {
  const body = await bookingService.createGuestBooking(bookingData, userId);
  return { status: 201, body };
}

async function getPricePreview({
  hotelId,
  roomId,
  checkInDate,
  checkOutDate,
  guestCount,
  selectedAddonIds,
}) {
  if (!hotelId || !roomId || !checkInDate || !checkOutDate) {
    throw new ServiceError(400, "Thiếu hotelId, roomId, checkInDate hoặc checkOutDate");
  }
  const body = await bookingService.previewBookingPrice(
    hotelId,
    roomId,
    checkInDate,
    checkOutDate,
    { guestCount: guestCount || 1, selectedAddonIds: selectedAddonIds || [] }
  );
  return { status: 200, body };
}

async function getMyBookings({ userId, hotelId, startDate, endDate, page, limit }) {
  const body = await bookingService.getMyBookings(userId, {
    hotelId,
    startDate,
    endDate,
    page,
    limit,
  });
  return { status: 200, body };
}

async function getUserBookings({ userId }) {
  const body = await bookingService.getUserBookings(userId);
  return { status: 200, body };
}

async function getAllBookings(query = {}) {
  const body = await bookingService.getAllBookings(query);
  return { status: 200, body };
}

async function getBookingsByOwner({ ownerId, hotelId, query = {} }) {
  const body = await bookingService.getBookingsByOwner(ownerId, hotelId || null, query);
  return { status: 200, body };
}

async function getStaffBookings({ staffId, query = {} }) {
  const body = await bookingService.getBookingsByStaff(staffId, query);
  return { status: 200, body };
}

async function getAvailableRooms({ hotelId, checkInDate, checkOutDate }) {
  if (!hotelId || !checkInDate || !checkOutDate) {
    throw new ServiceError(400, "Vui lòng cung cấp đầy đủ hotelId, checkInDate và checkOutDate");
  }
  const body = await bookingService.getAvailableRooms(hotelId, checkInDate, checkOutDate);
  return { status: 200, body };
}

async function handlePaidStatusSideEffects(bookingId, oldStatus) {
  const populatedBooking = await Booking.findById(bookingId)
    .populate("guest", "name email phone")
    .populate("hotel", "name address contactInfo")
    .populate("room", "roomNumber type price maxPeople");

  if (populatedBooking?.guest?.email) {
    const paymentMethod = populatedBooking.paymentMethod || "qr_code";
    sendReceiptEmail(populatedBooking, paymentMethod, populatedBooking.vnpTransactionRef || null)
      .then((success) => {
        if (success) console.log(`Đã gửi email hóa đơn cho booking ${bookingId} (cập nhật thủ công)`);
        else console.error(`Không thể gửi email hóa đơn cho booking ${bookingId}`);
      })
      .catch((err) => console.error("Lỗi khi gửi email hóa đơn:", err));

    sendCheckInReminderIfNeeded(populatedBooking).catch((err) =>
      console.error("Lỗi khi gửi email nhắc nhở check-in:", err)
    );
  }

  notifyPaymentSuccessful(bookingId).catch((err) =>
    console.error("Lỗi khi tạo thông báo đặt phòng mới cho owner:", err)
  );
  notifyGuestBookingConfirmed(bookingId).catch((err) =>
    console.error("Lỗi khi tạo thông báo xác nhận đặt phòng cho guest:", err)
  );

  const booking = await Booking.findById(bookingId);
  if (booking && getBookingFinalAmount(booking) >= 10000000) {
    notifyAdminHighValueBooking(bookingId, 10000000).catch((err) =>
      console.error("Lỗi khi tạo thông báo đặt phòng giá trị cao cho admin:", err)
    );
  }
}

async function updateBookingStatus({ id, status, user }) {
  if (user.role === "admin") {
    throw new ServiceError(403, "Admin chỉ được xem đơn đặt phòng và thống kê, không được chỉnh trạng thái đơn.");
  }
  if (user.role !== "owner") {
    throw new ServiceError(403, "Bạn không có quyền thực hiện thao tác này");
  }

  const oldBooking = await Booking.findById(id);
  const oldStatus = oldBooking?.paymentStatus;

  const booking = await bookingService.updateOwnerBookingStatus(id, status, user);

  if (status === "paid" && oldStatus !== "paid") {
    await handlePaidStatusSideEffects(id, oldStatus);
  }

  return { status: 200, body: { message: "Cập nhật trạng thái thành công", booking } };
}

async function cancelBooking({ id, user, body }) {
  const booking = await bookingService.cancelGuestBooking(id, body || {}, user);

  notifyBookingCancelled(id).catch((err) =>
    console.error("Lỗi khi tạo thông báo hủy đặt phòng cho owner:", err)
  );
  notifyGuestBookingCancelled(id).catch((err) =>
    console.error("Lỗi khi tạo thông báo hủy đặt phòng cho guest:", err)
  );

  return {
    status: 200,
    body: { message: "Đã hủy đơn đặt phòng thành công", booking },
  };
}

async function confirmGuestRefund({ id, user, file }) {
  const booking = await bookingService.confirmOwnerGuestRefund(id, user, file);
  return {
    status: 200,
    body: { message: "Đã xác nhận hoàn tiền cho khách", booking },
  };
}

async function rejectQrPayment({ id, user, rejectionType }) {
  const booking = await bookingService.rejectOwnerQrPayment(id, user, rejectionType);
  const isResubmit =
    booking.ownerQrRejectionType === "invalid_proof" && booking.paymentStatus === "pending";
  return {
    status: 200,
    body: {
      message: isResubmit
        ? "Đã yêu cầu khách tải lại minh chứng và thông báo cho khách"
        : "Đã hủy đơn đặt phòng và thông báo cho khách",
      booking,
    },
  };
}

async function reopenCancelledBooking({ id, user, reason }) {
  if (user.role !== "owner") {
    throw new ServiceError(403, "Chỉ chủ khách sạn mới được mở lại đơn đã hủy.");
  }

  const booking = await bookingService.reopenOwnerCancelledBooking(id, user, { reason });

  notifyGuestBookingReopened(id).catch((err) =>
    console.error("Lỗi khi tạo thông báo mở lại đơn cho guest:", err)
  );

  return {
    status: 200,
    body: {
      message: booking.vnpayPaidAt
        ? "Đã mở lại đơn. VNPay đã ghi nhận thanh toán — hãy xác minh nếu tiền đã về tài khoản."
        : booking.qrPaymentProofUrl
          ? "Đã mở lại đơn. Vui lòng xác nhận thanh toán nếu đã nhận đủ tiền."
          : booking.paymentMethod === "vnpay"
            ? "Đã mở lại đơn. Khách cần thanh toán VNPay lại trong thời gian giữ phòng mới."
            : "Đã mở lại đơn. Khách có thể tiếp tục thanh toán trong thời gian giữ phòng mới.",
      booking,
    },
  };
}

async function checkInWithNotification({ id, user, staff = false }) {
  const booking = staff
    ? await bookingService.staffCheckIn(id, user)
    : await bookingService.checkIn(id, user);
  notifyCheckIn(id).catch((err) => console.error("Lỗi khi tạo thông báo check-in:", err));
  return { status: 200, body: { message: "Check-in thành công", booking } };
}

async function checkOutWithNotification({
  id,
  user,
  staff = false,
  lateCheckoutFeeAmount,
  lateCheckoutFeeNote,
}) {
  const checkoutOptions = { lateCheckoutFeeAmount, lateCheckoutFeeNote };
  const booking = staff
    ? await bookingService.staffCheckOut(id, user, checkoutOptions)
    : await bookingService.checkOut(id, user, checkoutOptions);
  notifyCheckOut(id).catch((err) => console.error("Lỗi khi tạo thông báo check-out:", err));
  return { status: 200, body: { message: "Check-out thành công", booking } };
}

module.exports = {
  createBooking,
  getPricePreview,
  getMyBookings,
  getUserBookings,
  getAllBookings,
  getBookingsByOwner,
  getStaffBookings,
  getAvailableRooms,
  getBookingByIdForUser,
  getStaffBookingByIdWithReview,
  updateBookingStatus,
  cancelBooking,
  confirmGuestRefund,
  rejectQrPayment,
  reopenCancelledBooking,
  checkInWithNotification,
  checkOutWithNotification,
};
