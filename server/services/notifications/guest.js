const Booking = require("../../models/Booking");
const { createNotification } = require("./core");

const notifyGuestBookingConfirmed = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name')
      .populate('guest', 'name');

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('vi-VN');

    await createNotification(
      guestIdStr,
      'guest',
      'booking_confirmed',
      'Đặt phòng thành công',
      `Chúc mừng! Bạn đã đặt thành công phòng tại khách sạn ${booking.hotel?.name || 'N/A'}. Mã đặt phòng: #BK${bookingIdShort}. Check-in: ${checkInDate}.`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo xác nhận đặt phòng cho guest:', error);
  }
};

const notifyGuestBookingCancelled = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name')
      .populate('guest', 'name');

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();

    await createNotification(
      guestIdStr,
      'guest',
      'booking_cancelled',
      'Đơn đặt phòng đã được hủy',
      `Đơn đặt phòng #BK${bookingIdShort} của bạn đã được hủy thành công.`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo hủy đặt phòng cho guest:', error);
  }
};

const notifyGuestRefundProcessed = async (bookingId, refundAmount, percentage = 100) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('guest');

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();
    const amountStr = refundAmount.toLocaleString('vi-VN');

    await createNotification(
      guestIdStr,
      'guest',
      'refund_processed',
      'Hoàn tiền thành công',
      `Khách sạn đã xác nhận hoàn tiền ${percentage}% cho đơn #BK${bookingIdShort}. Số tiền ${amountStr} VNĐ — vui lòng đối chiếu tài khoản ngân hàng bạn đã cung cấp khi hủy đơn. Nếu chưa nhận, liên hệ trực tiếp khách sạn.`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo hoàn tiền cho guest:', error);
  }
};

const notifyGuestQrPaymentRejected = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("hotel", "name")
      .populate("guest", "name");

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();

    await createNotification(
      guestIdStr,
      "guest",
      "payment_rejected",
      "Đơn đặt phòng đã bị hủy",
      `Khách sạn ${booking.hotel?.name || "N/A"} đã hủy đơn #BK${bookingIdShort}. Lý do: Thanh toán chưa thành công. Vui lòng đặt phòng mới nếu vẫn có nhu cầu.`,
      bookingId,
      "Booking"
    );
  } catch (error) {
    console.error("Lỗi khi tạo thông báo từ chối minh chứng QR cho guest:", error);
  }
};

const notifyGuestQrProofResubmitRequired = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("hotel", "name")
      .populate("guest", "name");

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();

    await createNotification(
      guestIdStr,
      "guest",
      "qr_proof_resubmit",
      "Cần tải lại minh chứng thanh toán",
      `Khách sạn ${booking.hotel?.name || "N/A"} yêu cầu bạn tải lại minh chứng chuyển khoản cho đơn #BK${bookingIdShort}. Lý do: Minh chứng không hợp lệ.`,
      bookingId,
      "Booking"
    );
  } catch (error) {
    console.error("Lỗi khi tạo thông báo yêu cầu tải lại minh chứng QR cho guest:", error);
  }
};

const notifyGuestBookingReopened = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("hotel", "name")
      .populate("guest", "name");

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString("vi-VN");

    await createNotification(
      guestIdStr,
      "guest",
      "booking_reopened",
      "Đơn đặt phòng được mở lại",
      `Khách sạn ${booking.hotel?.name || "N/A"} đã mở lại đơn #BK${bookingIdShort}. Check-in: ${checkInDate}. Vui lòng kiểm tra trạng thái thanh toán trong tài khoản của bạn.`,
      bookingId,
      "Booking"
    );
  } catch (error) {
    console.error("Lỗi khi tạo thông báo mở lại đơn cho guest:", error);
  }
};

module.exports = {
  notifyGuestBookingConfirmed,
  notifyGuestBookingCancelled,
  notifyGuestBookingReopened,
  notifyGuestRefundProcessed,
  notifyGuestQrPaymentRejected,
  notifyGuestQrProofResubmitRequired,
};
