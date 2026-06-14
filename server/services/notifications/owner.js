const Booking = require("../../models/Booking");
const Review = require("../../models/Review");
const Hotel = require("../../models/Hotel");
const Notification = require("../../models/Notification");
const { createHotelNotification } = require("./core");
const { getHotelStatusLabel } = require("../../services/hotels/status");

/** Sự kiện vận hành KS → createHotelNotification (recipientRole: hotel). */

const notifyPaymentSuccessful = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("hotel", "name")
      .populate("room", "roomNumber")
      .populate("guest", "name");

    if (!booking?.hotel) return;

    const hotelId = booking.hotel._id;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();
    const checkInDate = new Date(booking.checkInDate).toLocaleDateString("vi-VN");
    const amount = booking.totalAmount.toLocaleString("vi-VN");
    const paymentMethod =
      booking.paymentMethod === "vnpay" ? "cổng thanh toán VNPay" : "QR code";

    await createHotelNotification(
      hotelId,
      "new_booking",
      "Đặt phòng mới",
      `Đơn đặt phòng mới #BK${bookingIdShort} từ ${booking.guest?.name || "Khách"}. Check-in: ${checkInDate}. Đã thanh toán ${amount} VNĐ qua ${paymentMethod}.`,
      bookingId,
      "Booking"
    );
  } catch (error) {
    console.error("Lỗi khi tạo thông báo đặt phòng mới:", error);
  }
};

const notifyBookingCancelled = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("hotel", "name")
      .populate("guest", "name");

    if (!booking?.hotel) return;

    const hotelId = booking.hotel._id;
    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();
    const reason = booking.cancellationReason ? ` Lý do: ${booking.cancellationReason}.` : "";
    const refundPending =
      booking.guestCancelSnapshot?.wasPaid &&
      booking.guestCancelSnapshot?.refundPolicyEligible &&
      !booking.ownerRefundCompletedAt;
    const refundHint = refundPending
      ? " Đơn đã thanh toán — cần hoàn tiền cho khách (xem chi tiết đơn: STK nhận hoàn nếu thanh toán QR, hoặc hoàn qua cổng VNPay)."
      : "";

    await createHotelNotification(
      hotelId,
      "booking_cancelled",
      "Khách hủy phòng",
      `Đơn #BK${bookingIdShort} đã bị hủy bởi ${booking.guest?.name || "Khách"}.${reason}${refundHint}`,
      bookingId,
      "Booking"
    );
  } catch (error) {
    console.error("Lỗi khi tạo thông báo hủy đặt phòng:", error);
  }
};

const notifyCheckIn = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("hotel", "name")
      .populate("room", "roomNumber")
      .populate("guest", "name");

    if (!booking?.hotel) return;

    await createHotelNotification(
      booking.hotel._id,
      "checkin_today",
      "Khách đã check-in",
      `Phòng ${booking.room?.roomNumber || "N/A"} — ${booking.guest?.name || "Khách"} đã check-in`,
      bookingId,
      "Booking"
    );
  } catch (error) {
    console.error("Lỗi khi tạo thông báo check-in:", error);
  }
};

const notifyCheckOut = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate("hotel", "name")
      .populate("room", "roomNumber")
      .populate("guest", "name");

    if (!booking?.hotel) return;

    await createHotelNotification(
      booking.hotel._id,
      "checkout_today",
      "Khách đã check-out",
      `Phòng ${booking.room?.roomNumber || "N/A"} — ${booking.guest?.name || "Khách"} đã check-out`,
      bookingId,
      "Booking"
    );
  } catch (error) {
    console.error("Lỗi khi tạo thông báo check-out:", error);
  }
};

const notifyNewReview = async (reviewId) => {
  try {
    const review = await Review.findById(reviewId)
      .populate("hotel", "name")
      .populate("guest", "name");

    if (!review?.hotel) return;

    const hotelId = review.hotel._id;
    const guestName = review.guest?.name || "Khách";

    if (review.rating <= 2) {
      await createHotelNotification(
        hotelId,
        "negative_review",
        "Cảnh báo: Đánh giá tiêu cực",
        `Đánh giá ${review.rating} sao từ ${guestName}.`,
        reviewId,
        "Review"
      );
    } else {
      await createHotelNotification(
        hotelId,
        "new_review",
        "Đánh giá mới",
        `${guestName} vừa đánh giá ${review.rating} sao.`,
        reviewId,
        "Review"
      );
    }
  } catch (error) {
    console.error("Lỗi khi tạo thông báo đánh giá mới:", error);
  }
};

const notifyNoShow = async (bookingId) => {
  try {
    const booking = await Booking.findById(bookingId).populate("hotel", "name");

    if (!booking?.hotel) return;

    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();

    await createHotelNotification(
      booking.hotel._id,
      "no_show",
      "Khách vắng mặt",
      `Đã quá giờ check-in nhưng khách chưa đến — đơn #BK${bookingIdShort}.`,
      bookingId,
      "Booking"
    );
  } catch (error) {
    console.error("Lỗi khi tạo thông báo khách vắng mặt:", error);
  }
};

const checkNoShowBookings = async () => {
  try {
    const now = new Date();
    const noShowBookings = await Booking.find({
      checkInDate: { $lt: now },
      checkedInAt: { $exists: false },
      paymentStatus: { $in: ["paid", "pending"] },
    })
      .populate("hotel", "ownerId")
      .limit(100);

    let notifiedCount = 0;
    for (const booking of noShowBookings) {
      if (!booking.hotel) continue;

      const existingNotification = await Notification.findOne({
        recipientRole: "hotel",
        hotel: booking.hotel._id,
        type: "no_show",
        relatedId: booking._id,
        relatedModel: "Booking",
      });

      if (!existingNotification) {
        await notifyNoShow(booking._id);
        notifiedCount++;
      }
    }

    return { checked: noShowBookings.length, notified: notifiedCount };
  } catch (error) {
    console.error("Lỗi khi kiểm tra no-show bookings:", error);
    throw error;
  }
};

/** Admin đổi trạng thái KS — thông báo owner + staff qua kênh hotel. */
const notifyHotelStatusChanged = async (hotelId, previousStatus, newStatus) => {
  try {
    if (!hotelId || previousStatus === newStatus) return;

    const hotel = await Hotel.findById(hotelId).select("name status");
    if (!hotel) return;

    const prevLabel = getHotelStatusLabel(previousStatus);
    const newLabel = getHotelStatusLabel(newStatus);

    let title;
    let message;

    if (newStatus === "active") {
      title = "Khách sạn được kích hoạt lại";
      message = `Quản trị viên đã chuyển trạng thái "${hotel.name}" từ ${prevLabel} sang ${newLabel}. Khách sạn hiển thị lại với khách và có thể nhận đặt phòng mới.`;
    } else if (newStatus === "maintenance") {
      title = "Khách sạn đang bảo trì";
      message = `Quản trị viên đã chuyển trạng thái "${hotel.name}" sang ${newLabel}. Khách sạn tạm ẩn với khách trong thời gian bảo trì và chưa nhận đặt phòng mới.`;
    } else if (newStatus === "inactive") {
      title = "Khách sạn dừng hoạt động";
      message = `Quản trị viên đã chuyển trạng thái "${hotel.name}" sang ${newLabel}. Khách sạn không còn hiển thị với khách và không nhận đặt phòng mới.`;
    } else {
      title = "Trạng thái khách sạn đã thay đổi";
      message = `Quản trị viên đã chuyển trạng thái "${hotel.name}" từ ${prevLabel} sang ${newLabel}.`;
    }

    await createHotelNotification(
      hotelId,
      "hotel_status_changed",
      title,
      message,
      hotelId,
      "Hotel"
    );
  } catch (error) {
    console.error("Lỗi khi tạo thông báo đổi trạng thái khách sạn:", error);
  }
};

module.exports = {
  notifyHotelStatusChanged,
  notifyPaymentSuccessful,
  notifyBookingCancelled,
  notifyCheckIn,
  notifyCheckOut,
  notifyNewReview,
  notifyNoShow,
  checkNoShowBookings,
};
