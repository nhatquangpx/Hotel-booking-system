const Booking = require("../../models/Booking");
const Review = require("../../models/Review");
const { createNotification } = require("./core");

/**
 * Guest Notification Service
 * All notification functions specific to guest role
 */

/**
 * Notify guest when booking is confirmed (after successful payment)
 */
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

/**
 * Notify guest when booking is cancelled
 */
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

/**
 * Notify guest when booking is modified
 */
const notifyGuestBookingModified = async (bookingId, changes) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('guest');

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();

    await createNotification(
      guestIdStr,
      'guest',
      'booking_modified',
      'Thông tin đặt phòng đã thay đổi',
      `Yêu cầu đổi ngày check-in của đơn #BK${bookingIdShort} đã được chấp nhận.`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo thay đổi đặt phòng cho guest:', error);
  }
};

/**
 * Notify guest when booking expires (payment timeout)
 */
const notifyGuestBookingExpired = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('guest');

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();

    await createNotification(
      guestIdStr,
      'guest',
      'booking_expired',
      'Đơn đặt phòng đã hết hạn',
      `Bạn đã quá thời gian thanh toán cho đơn #BK${bookingIdShort}. Đơn đặt phòng đã tự động hủy.`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo hết hạn đặt phòng cho guest:', error);
  }
};

/**
 * Notify guest about payment reminder
 */
const notifyGuestPaymentReminder = async (bookingId, dueDate) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('guest');

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();
    const dueDateStr = new Date(dueDate).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });

    await createNotification(
      guestIdStr,
      'guest',
      'payment_reminder',
      'Nhắc nhở thanh toán',
      `Vui lòng thanh toán số tiền còn lại cho đơn #BK${bookingIdShort} trước ${dueDateStr} để giữ phòng.`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo nhắc nhở thanh toán cho guest:', error);
  }
};

/**
 * Notify guest about refund processed
 */
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
      `Khách sạn đã xác nhận hoàn tiền ${percentage}% cho đơn #BK${bookingIdShort}. Số tiền ${amountStr} VNĐ — vui lòng đối chiếu tài khoản theo cách thanh toán bạn đã dùng (chuyển khoản/VNPay). Nếu chưa nhận, liên hệ trực tiếp khách sạn.`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo hoàn tiền cho guest:', error);
  }
};

/**
 * Notify guest about upcoming trip reminder
 */
const notifyGuestUpcomingTrip = async (bookingId, daysUntil) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name')
      .populate('guest');

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;

    await createNotification(
      guestIdStr,
      'guest',
      'upcoming_trip_reminder',
      'Nhắc nhở chuyến đi',
      `Chỉ còn ${daysUntil} ngày nữa là đến kỳ nghỉ! Xem lại thông tin đặt phòng tại đây.`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo nhắc nhở chuyến đi cho guest:', error);
  }
};

/**
 * Notify guest with check-in instructions
 */
const notifyGuestCheckInInstructions = async (bookingId, instructions) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('guest');

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;

    await createNotification(
      guestIdStr,
      'guest',
      'checkin_instructions',
      'Hướng dẫn Check-in',
      `Hướng dẫn nhận phòng: ${instructions}`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo hướng dẫn check-in cho guest:', error);
  }
};

/**
 * Notify guest about new message from owner
 */
const notifyGuestNewMessage = async (guestId, message, senderName) => {
  try {
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;

    await createNotification(
      guestIdStr,
      'guest',
      'new_message',
      'Tin nhắn mới',
      `${senderName || 'Chủ khách sạn'} vừa nhắn tin cho bạn: '${message}'`,
      null,
      null
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo tin nhắn mới cho guest:', error);
  }
};

/**
 * Notify guest to review after checkout
 */
const notifyGuestReviewRequest = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('guest');

    if (!booking || !booking.guest) {
      return;
    }

    const guestId = booking.guest._id || booking.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;

    await createNotification(
      guestIdStr,
      'guest',
      'review_request',
      'Mời đánh giá',
      `Bạn cảm thấy kỳ nghỉ thế nào? Hãy dành 1 phút đánh giá để nhận xu tích lũy nhé!`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo mời đánh giá cho guest:', error);
  }
};

/**
 * Notify guest about owner reply to review
 */
const notifyGuestReviewReply = async (reviewId, replyMessage) => {
  try {
    const review = await Review.findById(reviewId)
      .populate('guest');

    if (!review || !review.guest) {
      return;
    }

    const guestId = review.guest._id || review.guest;
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;

    await createNotification(
      guestIdStr,
      'guest',
      'review_reply',
      'Phản hồi từ chủ khách sạn',
      `Chủ khách sạn đã phản hồi đánh giá của bạn: '${replyMessage}'`,
      reviewId,
      'Review'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo phản hồi đánh giá cho guest:', error);
  }
};

/**
 * Notify guest about promotion/voucher
 */
const notifyGuestPromotion = async (guestId, promotionTitle, discount) => {
  try {
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;

    await createNotification(
      guestIdStr,
      'guest',
      'promotion',
      'Khuyến mãi mới',
      `Tặng bạn mã giảm giá ${discount}% cho lần đặt phòng tiếp theo nhân dịp ${promotionTitle}!`,
      null,
      null
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo khuyến mãi cho guest:', error);
  }
};

/**
 * Notify guest about security alert (password change, etc.)
 */
const notifyGuestSecurityAlert = async (guestId, alertType) => {
  try {
    const guestIdStr = guestId.toString ? guestId.toString() : guestId;
    let message = '';

    switch (alertType) {
      case 'password_changed':
        message = 'Mật khẩu của bạn vừa được thay đổi.';
        break;
      case 'email_changed':
        message = 'Email của bạn vừa được thay đổi.';
        break;
      default:
        message = 'Có thay đổi bảo mật trong tài khoản của bạn.';
    }

    await createNotification(
      guestIdStr,
      'guest',
      'security_alert',
      'Cảnh báo bảo mật',
      message,
      null,
      null
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo bảo mật cho guest:', error);
  }
};

module.exports = {
  notifyGuestBookingConfirmed,
  notifyGuestBookingCancelled,
  notifyGuestBookingModified,
  notifyGuestBookingExpired,
  notifyGuestPaymentReminder,
  notifyGuestRefundProcessed,
  notifyGuestUpcomingTrip,
  notifyGuestCheckInInstructions,
  notifyGuestNewMessage,
  notifyGuestReviewRequest,
  notifyGuestReviewReply,
  notifyGuestPromotion,
  notifyGuestSecurityAlert
};
