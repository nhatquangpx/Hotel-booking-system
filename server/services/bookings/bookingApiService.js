const Review = require("../../models/Review");
const Booking = require("../../models/Booking");
const {
  notifyBookingCancelled,
  notifyCheckIn,
  notifyCheckOut,
  notifyPaymentSuccessful,
  notifyGuestBookingConfirmed,
  notifyGuestBookingCancelled,
} = require("../notifications");
const { sendReceiptEmail, sendCheckInReminderIfNeeded } = require("../emails");
const bookingService = require("./index");
const { ServiceError } = require("../../lib/http/serviceError");

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

  if (oldStatus !== "paid") {
    // side effects only when transitioning to paid
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

async function checkInWithNotification({ id, user, staff = false }) {
  const booking = staff
    ? await bookingService.staffCheckIn(id, user)
    : await bookingService.checkIn(id, user);
  notifyCheckIn(id).catch((err) => console.error("Lỗi khi tạo thông báo check-in:", err));
  return { status: 200, body: { message: "Check-in thành công", booking } };
}

async function checkOutWithNotification({ id, user, staff = false }) {
  const booking = staff
    ? await bookingService.staffCheckOut(id, user)
    : await bookingService.checkOut(id, user);
  notifyCheckOut(id).catch((err) => console.error("Lỗi khi tạo thông báo check-out:", err));
  return { status: 200, body: { message: "Check-out thành công", booking } };
}

module.exports = {
  getBookingByIdForUser,
  getStaffBookingByIdWithReview,
  updateBookingStatus,
  cancelBooking,
  checkInWithNotification,
  checkOutWithNotification,
  bookingService,
};
