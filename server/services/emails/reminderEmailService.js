const Booking = require('../../models/Booking');
const { sendCheckInReminderEmail } = require('./bookingEmail');

/**
 * Tìm và gửi email nhắc nhở check-in cho các booking có checkInDate là 1 hoặc 2 ngày sau
 * Ví dụ: Hôm nay là 24, gửi email cho booking có checkInDate là 25 (ngày mai) hoặc 26 (2 ngày sau)
 * Chỉ gửi 1 lần cho mỗi booking để tránh spam
 * @returns {Promise<Object>} - Kết quả gửi email
 */
const sendCheckInReminders = async () => {
  try {
    // Tính ngày hôm nay (bắt đầu từ 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Tính ngày check-in sớm nhất (1 ngày sau - ngày mai)
    const checkInDateStart = new Date(today);
    checkInDateStart.setDate(checkInDateStart.getDate() + 1);
    checkInDateStart.setHours(0, 0, 0, 0);
    
    // Tính ngày check-in muộn nhất (2 ngày sau)
    const checkInDateEnd = new Date(today);
    checkInDateEnd.setDate(checkInDateEnd.getDate() + 2);
    checkInDateEnd.setHours(23, 59, 59, 999);

    console.log(`Đang tìm booking có checkInDate từ ${checkInDateStart.toISOString()} đến ${checkInDateEnd.toISOString()}`);

    // Tìm các booking có checkInDate là 1 hoặc 2 ngày sau, chưa được check-in, và chưa gửi email nhắc nhở
    const bookings = await Booking.find({
      checkInDate: {
        $gte: checkInDateStart,
        $lte: checkInDateEnd
      },
      paymentStatus: 'paid', // Chỉ gửi cho booking đã thanh toán
      checkedInAt: null, // Chưa check-in
      checkInReminderSent: { $ne: true } // Chưa gửi email nhắc nhở (tránh spam)
    })
    .populate('guest', 'name email phone')
    .populate('hotel', 'name address')
    .populate('room', 'roomNumber type price')
    .exec();

    console.log(`Tìm thấy ${bookings.length} booking cần gửi email nhắc nhở check-in`);

    const results = {
      total: bookings.length,
      success: 0,
      failed: 0,
      errors: []
    };

    // Gửi email cho từng booking
    for (const booking of bookings) {
      try {
        // Tính số ngày còn lại đến check-in (chỉ tính ngày, không tính giờ)
        const checkInDateOnly = new Date(booking.checkInDate);
        checkInDateOnly.setHours(0, 0, 0, 0);
        
        const daysUntilCheckIn = Math.ceil((checkInDateOnly - today) / (1000 * 60 * 60 * 24));
        
        // Sử dụng atomic operation để tránh race condition
        // Chỉ update nếu checkInReminderSent chưa được set
        const updatedBooking = await Booking.findOneAndUpdate(
          {
            _id: booking._id,
            checkInReminderSent: { $ne: true } // Chỉ update nếu chưa gửi email
          },
          {
            $set: { checkInReminderSent: true }
          },
          {
            new: true // Trả về document sau khi update
          }
        );

        // Nếu updatedBooking là null, nghĩa là đã có process khác set flag rồi (race condition)
        if (!updatedBooking) {
          console.log(`Booking ${booking._id} đã được xử lý bởi process khác, bỏ qua`);
          continue;
        }
        
        // Gửi email nhắc nhở
        const success = await sendCheckInReminderEmail(booking, daysUntilCheckIn);
        if (success) {
          results.success++;
          console.log(`Đã gửi email nhắc nhở check-in cho booking ${booking._id} (còn ${daysUntilCheckIn} ngày)`);
        } else {
          // Nếu gửi email thất bại, reset flag để có thể thử lại
          await Booking.findByIdAndUpdate(booking._id, { $set: { checkInReminderSent: false } });
          results.failed++;
          results.errors.push({
            bookingId: booking._id,
            error: 'Không thể gửi email'
          });
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          bookingId: booking._id,
          error: error.message
        });
        console.error(`Lỗi khi gửi email cho booking ${booking._id}:`, error);
      }
    }

    return results;
  } catch (error) {
    console.error('Lỗi khi gửi email nhắc nhở check-in:', error);
    throw error;
  }
};

/**
 * Kiểm tra và gửi email nhắc nhở check-in ngay lập tức cho một booking cụ thể
 * Được gọi khi booking được thanh toán thành công
 * Sử dụng atomic operation để tránh race condition
 * @param {Object} booking - Booking object đã được populate với guest, hotel, room
 * @returns {Promise<Boolean>} - True nếu đã gửi email, false nếu không cần gửi hoặc lỗi
 */
const sendCheckInReminderIfNeeded = async (booking) => {
  try {
    // Chỉ gửi nếu booking đã thanh toán và chưa check-in
    if (booking.paymentStatus !== 'paid' || booking.checkedInAt) {
      return false;
    }

    // Tính ngày hôm nay (bắt đầu từ 00:00:00)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Tính số ngày còn lại đến check-in (chỉ tính ngày, không tính giờ)
    const checkInDateOnly = new Date(booking.checkInDate);
    checkInDateOnly.setHours(0, 0, 0, 0);
    
    const daysUntilCheckIn = Math.ceil((checkInDateOnly - today) / (1000 * 60 * 60 * 24));

    // Chỉ gửi nếu checkInDate là 1 hoặc 2 ngày sau
    if (daysUntilCheckIn !== 1 && daysUntilCheckIn !== 2) {
      return false;
    }

    // Sử dụng atomic operation để tránh race condition
    // Chỉ update nếu checkInReminderSent chưa được set và các điều kiện khác vẫn đúng
    const updatedBooking = await Booking.findOneAndUpdate(
      {
        _id: booking._id,
        paymentStatus: 'paid',
        checkedInAt: null,
        checkInReminderSent: { $ne: true } // Chỉ update nếu chưa gửi email
      },
      {
        $set: { checkInReminderSent: true }
      },
      {
        new: true // Trả về document sau khi update
      }
    );

    // Nếu updatedBooking là null, nghĩa là đã có process khác set flag rồi hoặc điều kiện không thỏa mãn
    if (!updatedBooking) {
      return false;
    }

    // Gửi email nhắc nhở
    const success = await sendCheckInReminderEmail(booking, daysUntilCheckIn);
    
    if (success) {
      console.log(`Đã gửi email nhắc nhở check-in ngay lập tức cho booking ${booking._id} (còn ${daysUntilCheckIn} ngày)`);
      return true;
    } else {
      // Nếu gửi email thất bại, reset flag để có thể thử lại
      await Booking.findByIdAndUpdate(booking._id, { $set: { checkInReminderSent: false } });
      return false;
    }
  } catch (error) {
    console.error(`Lỗi khi gửi email nhắc nhở check-in cho booking ${booking._id}:`, error);
    return false;
  }
};

module.exports = {
  sendCheckInReminders,
  sendCheckInReminderIfNeeded,
};
