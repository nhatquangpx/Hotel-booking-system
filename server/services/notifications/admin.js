const Booking = require("../../models/Booking");
const Hotel = require("../../models/Hotel");
const User = require("../../models/User");
const { createNotification, sanitizeInput, sanitizeIP, sanitizeError } = require("./core");

/**
 * Admin Notification Service
 * All notification functions specific to admin role
 */

/**
 * ===== SECURITY & ACTIVITY NOTIFICATIONS =====
 */

/**
 * Notify admin about suspicious user activity
 */
const notifyAdminSuspiciousActivity = async (userId, activityType, details) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Get all admin users
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    let message = '';
    switch (activityType) {
      case 'multiple_failed_logins':
        message = `Người dùng ${sanitizeInput(user.name)} (${sanitizeInput(user.email)}) có ${sanitizeInput(details.count)} lần đăng nhập thất bại trong ${sanitizeInput(details.timeframe)}.`;
        break;
      case 'unusual_access_pattern':
        message = `Người dùng ${sanitizeInput(user.name)} (${sanitizeInput(user.email)}) có hoạt động truy cập bất thường từ ${sanitizeInput(details.location)}.`;
        break;
      case 'rapid_bookings':
        message = `Người dùng ${sanitizeInput(user.name)} (${sanitizeInput(user.email)}) đã tạo ${sanitizeInput(details.count)} đặt phòng trong thời gian ngắn.`;
        break;
      default:
        message = `Người dùng ${sanitizeInput(user.name)} (${sanitizeInput(user.email)}) có hoạt động đáng ngờ: ${sanitizeInput(details.description)}.`;
    }

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'suspicious_activity',
        'Hoạt động đáng ngờ',
        message,
        userId,
        'User'
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo hoạt động đáng ngờ cho admin:', error);
  }
};

/**
 * ===== HOTEL MANAGEMENT NOTIFICATIONS =====
 */

/**
 * Notify admin when new hotel registration request is submitted
 */
const notifyAdminHotelRegistrationRequest = async (hotelId) => {
  try {
    const hotel = await Hotel.findById(hotelId).populate('ownerId', 'name email');
    if (!hotel) return;

    // Get all admin users
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'hotel_registration_request',
        'Yêu cầu đăng ký khách sạn mới',
        `Khách sạn "${hotel.name}" do ${hotel.ownerId?.name || 'Chủ khách sạn'} sở hữu đang chờ phê duyệt.`,
        hotelId,
        'Hotel'
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo yêu cầu đăng ký khách sạn cho admin:', error);
  }
};

/**
 * Notify admin when hotel is approved (only to other admins)
 */
const notifyAdminHotelApproved = async (hotelId, approvedByAdminId) => {
  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return;

    // Get all admin users except the one who approved
    const admins = await User.find({ 
      role: 'admin', 
      status: 'active',
      _id: { $ne: approvedByAdminId }
    }).select('_id');

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'hotel_approved',
        'Khách sạn đã được phê duyệt',
        `Khách sạn "${hotel.name}" đã được phê duyệt và kích hoạt.`,
        hotelId,
        'Hotel'
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo phê duyệt khách sạn cho admin:', error);
  }
};

/**
 * Notify admin when hotel is rejected
 */
const notifyAdminHotelRejected = async (hotelId, rejectedByAdminId, reason) => {
  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return;

    // Get all admin users except the one who rejected
    const admins = await User.find({ 
      role: 'admin', 
      status: 'active',
      _id: { $ne: rejectedByAdminId }
    }).select('_id');

    const reasonText = reason ? ` Lý do: ${reason}.` : '';

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'hotel_rejected',
        'Khách sạn bị từ chối',
        `Khách sạn "${hotel.name}" đã bị từ chối phê duyệt.${reasonText}`,
        hotelId,
        'Hotel'
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo từ chối khách sạn cho admin:', error);
  }
};

/**
 * Notify admin when hotel is suspended
 */
const notifyAdminHotelSuspended = async (hotelId, suspendedByAdminId, reason) => {
  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return;

    // Get all admin users except the one who suspended
    const admins = await User.find({ 
      role: 'admin', 
      status: 'active',
      _id: { $ne: suspendedByAdminId }
    }).select('_id');

    const reasonText = reason ? ` Lý do: ${reason}.` : '';

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'hotel_suspended',
        'Khách sạn bị tạm ngưng',
        `Khách sạn "${hotel.name}" đã bị tạm ngưng hoạt động.${reasonText}`,
        hotelId,
        'Hotel'
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo tạm ngưng khách sạn cho admin:', error);
  }
};

/**
 * ===== CRITICAL ACTIVITIES NOTIFICATIONS =====
 */

/**
 * Notify admin about high-value booking
 */
const notifyAdminHighValueBooking = async (bookingId, threshold = 10000000) => {
  try {
    const booking = await Booking.findById(bookingId)
      .populate('hotel', 'name')
      .populate('guest', 'name email');

    if (!booking || booking.totalAmount < threshold) return;

    // Get all admin users
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    const bookingIdShort = bookingId.toString().slice(-6).toUpperCase();
    const amount = booking.totalAmount.toLocaleString('vi-VN');

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

/**
 * Notify admin about multiple cancellations (potential issue)
 */
const notifyAdminMultipleCancellations = async (userId, cancellationCount, timeframe) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    // Get all admin users
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'multiple_cancellations',
        'Nhiều đặt phòng bị hủy',
        `Người dùng ${user.name} (${user.email}) đã hủy ${cancellationCount} đặt phòng trong ${timeframe}. Có thể cần kiểm tra.`,
        userId,
        'User'
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo nhiều hủy đặt phòng cho admin:', error);
  }
};

/**
 * Notify admin about spike in negative reviews
 */
const notifyAdminNegativeReviewSpike = async (hotelId, reviewCount, timeRange) => {
  try {
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) return;

    // Get all admin users
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'negative_review_spike',
        'Tăng đột biến đánh giá tiêu cực',
        `Khách sạn "${hotel.name}" nhận ${reviewCount} đánh giá tiêu cực (≤2 sao) trong ${timeRange}. Có thể cần kiểm tra chất lượng dịch vụ.`,
        hotelId,
        'Hotel'
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo tăng đột biến đánh giá tiêu cực cho admin:', error);
  }
};

/**
 * ===== SYSTEM & SECURITY NOTIFICATIONS =====
 */

/**
 * Notify admin about system alerts (errors, downtime, etc.)
 */
const notifyAdminSystemAlert = async (alertType, message, details = {}) => {
  try {
    // Get all admin users
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    let title = '';
    switch (alertType) {
      case 'error':
        title = 'Lỗi hệ thống';
        break;
      case 'downtime':
        title = 'Hệ thống tạm ngưng';
        break;
      case 'performance':
        title = 'Cảnh báo hiệu suất';
        break;
      case 'maintenance':
        title = 'Bảo trì hệ thống';
        break;
      default:
        title = 'Cảnh báo hệ thống';
    }

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'system_alert',
        title,
        message || `Hệ thống gặp vấn đề: ${sanitizeInput(alertType)}. ${sanitizeInput(details.description)}`,
        null,
        null
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo cảnh báo hệ thống cho admin:', error);
  }
};

/**
 * Notify admin about security breach attempts
 */
const notifyAdminSecurityBreachAttempt = async (attemptType, details) => {
  try {
    // Get all admin users
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    let message = '';
    switch (attemptType) {
      case 'brute_force':
        message = `Phát hiện tấn công brute force từ IP ${sanitizeIP(details.ip)} vào tài khoản ${sanitizeInput(details.target)}.`;
        break;
      case 'sql_injection':
        message = `Phát hiện nỗ lực SQL injection từ IP ${sanitizeIP(details.ip)}.`;
        break;
      case 'unauthorized_access':
        message = `Phát hiện truy cập trái phép vào ${sanitizeInput(details.resource)} từ IP ${sanitizeIP(details.ip)}.`;
        break;
      default:
        message = `Phát hiện nỗ lực tấn công bảo mật: ${sanitizeInput(attemptType)}. Chi tiết: ${sanitizeInput(details.description)}.`;
    }

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'security_breach_attempt',
        'Cảnh báo bảo mật',
        message,
        null,
        null
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo tấn công bảo mật cho admin:', error);
  }
};

/**
 * Notify admin about payment issues
 */
const notifyAdminPaymentIssue = async (issueType, details) => {
  try {
    // Get all admin users
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    let message = '';
    switch (issueType) {
      case 'failed_transaction':
        const transactionId = sanitizeInput(details.transactionId, 50);
        const errorMsg = sanitizeError(details.error);
        message = `Giao dịch thanh toán ${transactionId} thất bại. Lỗi: ${errorMsg}.`;
        break;
      case 'large_refund':
        const amount = details.amount ? details.amount.toLocaleString('vi-VN') : 'N/A';
        const bookingIdShort = details.bookingId ? sanitizeInput(details.bookingId.slice(-6).toUpperCase(), 20) : 'N/A';
        message = `Yêu cầu hoàn tiền lớn ${amount} VNĐ cho đơn #${bookingIdShort}.`;
        break;
      case 'payment_gateway_error':
        const gateway = sanitizeInput(details.gateway || 'VNPay', 50);
        const gatewayError = sanitizeError(details.error);
        message = `Lỗi kết nối cổng thanh toán ${gateway}. ${gatewayError}`;
        break;
      default:
        message = `Vấn đề thanh toán: ${sanitizeInput(issueType)}. ${sanitizeInput(details.description)}`;
    }

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'payment_issue',
        'Vấn đề thanh toán',
        message,
        details.bookingId || null,
        details.bookingId ? 'Booking' : null
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo vấn đề thanh toán cho admin:', error);
  }
};

/**
 * ===== REPORTS & ANALYTICS NOTIFICATIONS =====
 */

/**
 * Notify admin about daily summary
 */
const notifyAdminDailySummary = async (summaryData) => {
  try {
    // Get all admin users
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    const revenue = summaryData.revenue?.toLocaleString('vi-VN') || '0';
    const newBookings = summaryData.newBookings || 0;
    const newUsers = summaryData.newUsers || 0;
    const newHotels = summaryData.newHotels || 0;

    const message = `Tóm tắt ngày: Doanh thu ${revenue} VNĐ, ${newBookings} đặt phòng mới, ${newUsers} người dùng mới, ${newHotels} khách sạn mới.`;

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'daily_summary',
        'Tóm tắt hoạt động hàng ngày',
        message,
        null,
        null
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo tóm tắt hàng ngày cho admin:', error);
  }
};

/**
 * Notify admin about weekly report
 */
const notifyAdminWeeklyReport = async (reportData) => {
  try {
    // Get all admin users
    const admins = await User.find({ role: 'admin', status: 'active' }).select('_id');

    const revenue = reportData.revenue?.toLocaleString('vi-VN') || '0';
    const totalBookings = reportData.totalBookings || 0;
    const totalUsers = reportData.totalUsers || 0;
    const growth = reportData.growth || 0;

    const message = `Báo cáo tuần: Tổng doanh thu ${revenue} VNĐ, ${totalBookings} đặt phòng, ${totalUsers} người dùng. Tăng trưởng ${growth > 0 ? '+' : ''}${growth}% so với tuần trước.`;

    const notifications = admins.map(admin =>
      createNotification(
        admin._id.toString(),
        'admin',
        'weekly_report',
        'Báo cáo tuần',
        message,
        null,
        null
      )
    );

    await Promise.all(notifications);
  } catch (error) {
    console.error('Lỗi khi tạo thông báo báo cáo tuần cho admin:', error);
  }
};

module.exports = {
  // Security & Activity
  notifyAdminSuspiciousActivity,
  // Hotel Management
  notifyAdminHotelRegistrationRequest,
  notifyAdminHotelApproved,
  notifyAdminHotelRejected,
  notifyAdminHotelSuspended,
  // Critical Activities
  notifyAdminHighValueBooking,
  notifyAdminMultipleCancellations,
  notifyAdminNegativeReviewSpike,
  // System & Security
  notifyAdminSystemAlert,
  notifyAdminSecurityBreachAttempt,
  notifyAdminPaymentIssue,
  // Reports & Analytics
  notifyAdminDailySummary,
  notifyAdminWeeklyReport
};
