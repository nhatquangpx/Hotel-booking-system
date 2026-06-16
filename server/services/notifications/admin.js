const Booking = require("../../models/Booking");
const User = require("../../models/User");
const { createNotification } = require("./core");
const { getBookingFinalAmount } = require("../bookings/bookingAmount");

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

module.exports = {
  notifyAdminHighValueBooking,
};
