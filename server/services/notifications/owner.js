const Booking = require("../../models/Booking");
const Review = require("../../models/Review");
const Notification = require("../../models/Notification");
const { createNotification } = require("./core");

/**
 * Owner Notification Service
 * All notification functions specific to owner role
 */

/**
 * Create notification for successful payment
 * Đây cũng là thông báo đặt phòng mới vì chỉ thông báo khi đã thanh toán thành công
 * Để tránh spam từ các đơn đặt phòng không thanh toán
 */
const notifyPaymentSuccessful = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name ownerId')
      .populate('room', 'roomNumber')
      .populate('guest', 'name');

    if (!booking || !booking.hotel) {
      return;
    }

    const ownerId = booking.hotel.ownerId;
    if (!ownerId) return;

    // Convert ownerId to string if it's ObjectId
    const ownerIdStr = ownerId.toString ? ownerId.toString() : ownerId;

    // Format booking ID (lấy 6 ký tự cuối)
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString('vi-VN');
    const amount = booking.totalAmount.toLocaleString('vi-VN');
    const paymentMethod = booking.paymentMethod === 'vnpay' ? 'cổng thanh toán VNPay' : 'QR code';

    // Tạo thông báo "Đặt phòng mới" khi thanh toán thành công
    // Vì chỉ có đơn đã thanh toán mới được thông báo đến owner
    await createNotification(
      ownerIdStr,
      'owner',
      'new_booking',
      'Đặt phòng mới',
      `Bạn có đơn đặt phòng mới #BK${bookingIdShort} từ khách hàng ${booking.guest?.name || 'Khách'}. Check-in: ${checkInDate}. Đã thanh toán ${amount} VNĐ qua ${paymentMethod}.`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo đặt phòng mới (sau thanh toán):', error);
  }
};

/**
 * Create notification for cancelled booking
 */
const notifyBookingCancelled = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name ownerId')
      .populate('room', 'roomNumber')
      .populate('guest', 'name');

    if (!booking || !booking.hotel) {
      return;
    }

    const ownerId = booking.hotel.ownerId;
    if (!ownerId) return;

    // Convert ownerId to string if it's ObjectId
    const ownerIdStr = ownerId.toString ? ownerId.toString() : ownerId;

    // Format booking ID (lấy 6 ký tự cuối)
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();
    const reason = booking.cancellationReason ? ` Lý do: ${booking.cancellationReason}.` : '';

    await createNotification(
      ownerIdStr,
      'owner',
      'booking_cancelled',
      'Khách hủy phòng',
      `Đơn hàng #BK${bookingIdShort} đã bị hủy bởi khách hàng ${booking.guest?.name || 'Khách'}.${reason}`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo hủy đặt phòng:', error);
  }
};

/**
 * Create notification for check-in
 */
const notifyCheckIn = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name ownerId')
      .populate('room', 'roomNumber')
      .populate('guest', 'name');

    if (!booking || !booking.hotel) {
      return;
    }

    const ownerId = booking.hotel.ownerId;
    if (!ownerId) return;

    // Convert ownerId to string if it's ObjectId
    const ownerIdStr = ownerId.toString ? ownerId.toString() : ownerId;

    await createNotification(
      ownerIdStr,
      'owner',
      'checkin_today',
      'Khách đã check-in',
      `Phòng ${booking.room?.roomNumber || 'N/A'} - ${booking.guest?.name || 'Khách'} đã check-in`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo check-in:', error);
  }
};

/**
 * Create notification for check-out
 */
const notifyCheckOut = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name ownerId')
      .populate('room', 'roomNumber')
      .populate('guest', 'name');

    if (!booking || !booking.hotel) {
      return;
    }

    const ownerId = booking.hotel.ownerId;
    if (!ownerId) return;

    // Convert ownerId to string if it's ObjectId
    const ownerIdStr = ownerId.toString ? ownerId.toString() : ownerId;

    await createNotification(
      ownerIdStr,
      'owner',
      'checkout_today',
      'Khách đã check-out',
      `Phòng ${booking.room?.roomNumber || 'N/A'} - ${booking.guest?.name || 'Khách'} đã check-out`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo check-out:', error);
  }
};

/**
 * Create notification for new review
 */
const notifyNewReview = async (reviewId) => {
  try {
    const review = await Review.findById(reviewId)
      .populate('hotel', 'name ownerId')
      .populate('guest', 'name');

    if (!review || !review.hotel) {
      return;
    }

    const ownerId = review.hotel.ownerId;
    if (!ownerId) return;

    // Convert ownerId to string if it's ObjectId
    const ownerIdStr = ownerId.toString ? ownerId.toString() : ownerId;

    // Kiểm tra nếu rating <= 2 thì tạo thông báo negative_review
    if (review.rating <= 2) {
      await createNotification(
        ownerIdStr,
        'owner',
        'negative_review',
        'Cảnh báo: Đánh giá tiêu cực',
        `Cảnh báo: Có một đánh giá ${review.rating} sao từ khách hàng ${review.guest?.name || 'Khách'}.`,
        reviewId,
        'Review'
      );
    } else {
      await createNotification(
        ownerIdStr,
        'owner',
        'new_review',
        'Đánh giá mới từ khách hàng',
        `Khách hàng ${review.guest?.name || 'Khách'} vừa đánh giá ${review.rating} sao cho khách sạn của bạn.`,
        reviewId,
        'Review'
      );
    }
  } catch (error) {
    console.error('Lỗi khi tạo thông báo đánh giá mới:', error);
  }
};

/**
 * Create notification for no-show (khách vắng mặt)
 */
const notifyNoShow = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name ownerId')
      .populate('room', 'roomNumber')
      .populate('guest', 'name');

    if (!booking || !booking.hotel) {
      return;
    }

    const ownerId = booking.hotel.ownerId;
    if (!ownerId) return;

    // Convert ownerId to string if it's ObjectId
    const ownerIdStr = ownerId.toString ? ownerId.toString() : ownerId;

    // Format booking ID (lấy 6 ký tự cuối)
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();

    await createNotification(
      ownerIdStr,
      'owner',
      'no_show',
      'Khách vắng mặt',
      `Đã quá giờ check-in nhưng khách hàng của đơn #BK${bookingIdShort} chưa xuất hiện.`,
      bookingId,
      'Booking'
    );
  } catch (error) {
    console.error('Lỗi khi tạo thông báo khách vắng mặt:', error);
  }
};

/**
 * Check and notify no-show bookings
 * This function should be called periodically (e.g., via cron job or endpoint)
 */
const checkNoShowBookings = async () => {
  try {
    const now = new Date();
    // Tìm các booking có checkInDate đã qua, chưa check-in, và paymentStatus là paid hoặc pending
    const noShowBookings = await Booking.find({
      checkInDate: { $lt: now },
      checkedInAt: { $exists: false },
      paymentStatus: { $in: ['paid', 'pending'] }
    })
      .populate('hotel', 'ownerId')
      .limit(100); // Giới hạn để tránh quá tải

    let notifiedCount = 0;
    for (const booking of noShowBookings) {
      if (booking.hotel && booking.hotel.ownerId) {
        // Kiểm tra xem đã có thông báo no-show cho booking này chưa
        const existingNotification = await Notification.findOne({
          recipient: booking.hotel.ownerId,
          recipientRole: 'owner',
          type: 'no_show',
          relatedId: booking._id,
          relatedModel: 'Booking'
        });

        // Chỉ tạo thông báo nếu chưa có
        if (!existingNotification) {
          await notifyNoShow(booking._id);
          notifiedCount++;
        }
      }
    }

    return { checked: noShowBookings.length, notified: notifiedCount };
  } catch (error) {
    console.error('Lỗi khi kiểm tra no-show bookings:', error);
    throw error;
  }
};

module.exports = {
  notifyPaymentSuccessful,
  notifyBookingCancelled,
  notifyCheckIn,
  notifyCheckOut,
  notifyNewReview,
  notifyNoShow,
  checkNoShowBookings
};
