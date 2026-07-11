const Booking = require("../../models/Booking");
const User = require("../../models/User");
const CancelAbuseFlag = require("../../models/CancelAbuseFlag");
const { createNotification } = require("./core");
const { getBookingFinalAmount } = require("../bookings/bookingAmount");
const { WINDOW_DAYS } = require("../moderation/cancelAbuseConfig");

const notifyAdminHighValueBooking = async (bookingId, threshold = 10000000) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name')
      .populate('guest', 'name email');

    if (!booking || getBookingFinalAmount(booking) < threshold) return;

    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();
    const amount = getBookingFinalAmount(booking).toLocaleString('vi-VN');

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'high_value_booking',
        'Đặt phòng giá trị cao',
        `Đơn đặt phòng #BK${bookingIdShort} có giá trị ${amount} VNĐ từ khách ${booking.guest?.name || 'N/A'} tại khách sạn ${booking.hotel?.name || 'N/A'}.`,
        bookingId,
        'Booking'
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo đặt phòng giá trị cao cho admin:', error);
  }
};

const notifyAdminCancelAbuse = async (flagId) => {
  try {
    const flag = await CancelAbuseFlag.findById(flagId).populate("guest", "name email phone");
    if (!flag?.guest) return;

    const admins = await User.find({ role: "admin", status: "active" }).select("_id");
    if (!admins.length) return;

    const guestName = flag.guest.name || "N/A";
    const message = `Khách ${guestName} (${flag.guest.email || "—"}) đã hủy ${flag.cancelCount} đơn trong ${WINDOW_DAYS} ngày. Vui lòng xem xét vô hiệu hóa tài khoản.`;

    await Promise.all(
      admins.map((admin) =>
        createNotification(
          admin._id.toString(),
          "admin",
          "cancel_abuse_alert",
          "Danh sách đen — hủy đơn liên tục",
          message,
          flag._id,
          "CancelAbuseFlag"
        )
      )
    );
  } catch (error) {
    console.error("Lỗi khi tạo thông báo cancel abuse cho admin:", error);
  }
};

module.exports = {
  notifyAdminHighValueBooking,
  notifyAdminCancelAbuse,
};
