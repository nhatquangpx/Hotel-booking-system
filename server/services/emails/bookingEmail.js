const { sendEmail } = require("./emailService");

/**
 * Gửi hóa đơn điện tử cho booking
 * @param {Object} booking - Booking object đã được populate với hotel, room, guest
 * @param {String} paymentMethod - Phương thức thanh toán (vnpay hoặc qr_code)
 * @param {String} transactionRef - Mã giao dịch (nếu có)
 * @returns {Promise<Boolean>} - Success status
 */
const sendReceiptEmail = async (booking, paymentMethod = 'qr_code', transactionRef = null) => {
  try {
    // Lấy thông tin từ booking
    const guest = booking.guest;
    const hotel = booking.hotel;
    const room = booking.room;
    
    if (!guest || !guest.email) {
      console.error('Không tìm thấy email của khách hàng');
      return false;
    }

    // Format ngày tháng
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    const formatDateTime = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    // Format giá tiền
    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    // Tính số đêm
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Tạo mã booking ngắn gọn
    const bookingIdShort = booking._id.toString().slice(-8).toUpperCase();

    // Tên phương thức thanh toán
    const paymentMethodName = paymentMethod === 'vnpay' ? 'VNPay' : 'Chuyển khoản qua QR Code';

    // Địa chỉ khách sạn
    const hotelAddress = hotel.address 
      ? `${hotel.address.number} ${hotel.address.street}, ${hotel.address.city}`
      : 'N/A';

    // Loại phòng
    const roomTypeMap = {
      'standard': 'Phòng tiêu chuẩn',
      'deluxe': 'Phòng cao cấp',
      'suite': 'Phòng Suite',
      'family': 'Phòng gia đình',
      'executive': 'Phòng hạng sang'
    };
    const roomTypeName = roomTypeMap[room.type] || room.type;

    const subject = `Hóa đơn điện tử - Đặt phòng #BK${bookingIdShort}`;
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1C1B1F;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .invoice-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #A0826D;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #A0826D;
      margin: 0;
      font-size: 28px;
      font-weight: 700;
    }
    .header p {
      color: #79747E;
      margin: 5px 0;
      font-size: 14px;
    }
    .invoice-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 30px;
      padding: 15px;
      background-color: #f8f9fa;
      border-radius: 5px;
    }
    .invoice-info-left, .invoice-info-right {
      flex: 1;
    }
    .invoice-info-right {
      text-align: right;
    }
    .invoice-info p {
      margin: 5px 0;
      color: #1C1B1F;
      font-size: 14px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 700;
      color: #A0826D;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e9ecef;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-label {
      font-weight: 600;
      color: #79747E;
      width: 40%;
      font-size: 14px;
    }
    .info-value {
      color: #1C1B1F;
      width: 60%;
      text-align: right;
      font-size: 14px;
    }
    .booking-details {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .total-section {
      background-color: #A0826D;
      color: #ffffff;
      padding: 20px;
      border-radius: 5px;
      text-align: center;
      margin-top: 30px;
      box-shadow: 0 2px 4px rgba(160, 130, 109, 0.2);
    }
    .total-label {
      font-size: 16px;
      margin-bottom: 10px;
      color: #ffffff;
      opacity: 0.95;
    }
    .total-amount {
      font-size: 32px;
      font-weight: 700;
      color: #ffffff;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      color: #79747E;
      font-size: 14px;
    }
    .transaction-ref {
      background-color: #fffbe6;
      border: 1px solid #F5C842;
      padding: 10px;
      border-radius: 5px;
      margin: 15px 0;
      font-size: 12px;
      color: #B8941F;
    }
    .status-paid {
      color: #2ecc71;
      font-weight: 600;
    }
    .discount-value {
      color: #e74c3c;
    }
  </style>
</head>
<body>
  <div class="invoice-container">
    <div class="header">
      <h1>HÓA ĐƠN ĐIỆN TỬ</h1>
      <p>Hệ thống đặt phòng khách sạn trực tuyến</p>
    </div>

    <div class="invoice-info">
      <div class="invoice-info-left">
        <p><strong>Mã đặt phòng:</strong> #BK${bookingIdShort}</p>
        <p><strong>Ngày xuất hóa đơn:</strong> ${formatDateTime(new Date())}</p>
      </div>
      <div class="invoice-info-right">
        <p><strong>Trạng thái:</strong> <span class="status-paid">Đã thanh toán</span></p>
        ${transactionRef ? `<p><strong>Mã giao dịch:</strong> ${transactionRef}</p>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Thông tin khách hàng</div>
      <div class="info-row">
        <span class="info-label">Họ và tên:</span>
        <span class="info-value">${guest.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">${guest.email || 'N/A'}</span>
      </div>
      ${guest.phone ? `
      <div class="info-row">
        <span class="info-label">Số điện thoại:</span>
        <span class="info-value">${guest.phone}</span>
      </div>
      ` : ''}
    </div>

    <div class="section">
      <div class="section-title">Thông tin đặt phòng</div>
      <div class="booking-details">
        <div class="info-row">
          <span class="info-label">Khách sạn:</span>
          <span class="info-value"><strong>${hotel.name || 'N/A'}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Địa chỉ:</span>
          <span class="info-value">${hotelAddress}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phòng:</span>
          <span class="info-value">${room.roomNumber || 'N/A'} - ${roomTypeName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ngày nhận phòng:</span>
          <span class="info-value">${formatDate(booking.checkInDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ngày trả phòng:</span>
          <span class="info-value">${formatDate(booking.checkOutDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Số đêm:</span>
          <span class="info-value">${nights} đêm</span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Chi tiết thanh toán</div>
      <div class="info-row">
        <span class="info-label">Giá phòng/đêm:</span>
        <span class="info-value">${formatPrice(room.price?.regular || booking.totalAmount / nights)}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Số đêm:</span>
        <span class="info-value">${nights} đêm</span>
      </div>
      ${room.price?.discount && room.price.discount > 0 ? `
      <div class="info-row">
        <span class="info-label">Giảm giá:</span>
        <span class="info-value discount-value">-${formatPrice(room.price.discount * nights)}</span>
      </div>
      ` : ''}
      <div class="total-section">
        <div class="total-label">Tổng thanh toán</div>
        <div class="total-amount">${formatPrice(booking.totalAmount)}</div>
      </div>
      <div class="info-row" style="margin-top: 15px;">
        <span class="info-label">Phương thức thanh toán:</span>
        <span class="info-value"><strong>${paymentMethodName}</strong></span>
      </div>
      <div class="info-row">
        <span class="info-label">Thời gian thanh toán:</span>
        <span class="info-value">${formatDateTime(new Date())}</span>
      </div>
      ${transactionRef ? `
      <div class="transaction-ref">
        <strong>Mã giao dịch:</strong> ${transactionRef}
      </div>
      ` : ''}
    </div>

    ${booking.specialRequests ? `
    <div class="section">
      <div class="section-title">Yêu cầu đặc biệt</div>
      <p style="background-color: #f9f9f9; padding: 15px; border-radius: 5px;">${booking.specialRequests}</p>
    </div>
    ` : ''}

    <div class="footer">
      <p><strong>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</strong></p>
      <p>Hóa đơn này có giá trị pháp lý và được lưu trữ trong hệ thống.</p>
      <p>Nếu có thắc mắc, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
      <p style="margin-top: 20px; color: #999; font-size: 12px;">
        Đây là email tự động, vui lòng không trả lời email này.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return await sendEmail(guest.email, subject, html);
  } catch (error) {
    console.error('Lỗi khi gửi email hóa đơn:', error);
    return false;
  }
};

/**
 * Gửi email nhắc nhở check-in cho booking
 * @param {Object} booking - Booking object đã được populate với hotel, room, guest
 * @param {Number} daysUntilCheckIn - Số ngày còn lại đến check-in (1 hoặc 2)
 * @returns {Promise<Boolean>} - Success status
 */
const sendCheckInReminderEmail = async (booking, daysUntilCheckIn = 2) => {
  try {
    // Lấy thông tin từ booking
    const guest = booking.guest;
    const hotel = booking.hotel;
    const room = booking.room;
    
    if (!guest || !guest.email) {
      console.error('Không tìm thấy email của khách hàng');
      return false;
    }

    // Format ngày tháng
    const formatDate = (date) => {
      if (!date) return 'N/A';
      return new Date(date).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    };

    // Format giá tiền
    const formatPrice = (price) => {
      return new Intl.NumberFormat('vi-VN').format(price) + ' VNĐ';
    };

    // Tính số đêm
    const checkIn = new Date(booking.checkInDate);
    const checkOut = new Date(booking.checkOutDate);
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));

    // Tạo mã booking ngắn gọn
    const bookingIdShort = booking._id.toString().slice(-8).toUpperCase();

    // Địa chỉ khách sạn
    const hotelAddress = hotel.address 
      ? `${hotel.address.number} ${hotel.address.street}, ${hotel.address.city}`
      : 'N/A';

    // Loại phòng
    const roomTypeMap = {
      'standard': 'Phòng tiêu chuẩn',
      'deluxe': 'Phòng cao cấp',
      'suite': 'Phòng Suite',
      'family': 'Phòng gia đình',
      'executive': 'Phòng hạng sang'
    };
    const roomTypeName = roomTypeMap[room.type] || room.type;

    // Link đến booking detail
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const bookingDetailUrl = `${frontendUrl}/my-bookings?bookingId=${booking._id}`;

    // Tạo thông điệp nhắc nhở dựa trên số ngày còn lại
    const reminderMessage = daysUntilCheckIn === 1 
      ? 'Ngày mai là ngày check-in của bạn!'
      : `Còn ${daysUntilCheckIn} ngày nữa là đến ngày check-in!`;

    const subject = `Nhắc nhở check-in - Đặt phòng #BK${bookingIdShort}`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      line-height: 1.6;
      color: #1C1B1F;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
      background-color: #f8f9fa;
    }
    .reminder-container {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #A0826D;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #A0826D;
      margin: 0;
      font-size: 28px;
    }
    .header p {
      color: #79747E;
      margin: 5px 0;
    }
    .reminder-badge {
      background-color: #fffbe6;
      border: 2px solid #F5C842;
      border-radius: 8px;
      padding: 15px;
      margin-bottom: 25px;
      text-align: center;
    }
    .reminder-badge h2 {
      color: #B8941F;
      margin: 0 0 10px 0;
      font-size: 20px;
    }
    .reminder-badge p {
      color: #79747E;
      margin: 5px 0;
      font-size: 16px;
    }
    .section {
      margin-bottom: 25px;
    }
    .section-title {
      font-size: 18px;
      font-weight: bold;
      color: #A0826D;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 2px solid #e9ecef;
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #f0f0f0;
    }
    .info-label {
      font-weight: 600;
      color: #79747E;
      width: 40%;
    }
    .info-value {
      color: #1C1B1F;
      width: 60%;
      text-align: right;
      font-size: 14px;
    }
    .booking-details {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .cta-button {
      display: block;
      text-align: center;
      background-color: #A0826D;
      color: #ffffff;
      padding: 15px 30px;
      border-radius: 5px;
      text-decoration: none;
      font-weight: bold;
      font-size: 16px;
      margin: 30px 0;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    }
    .cta-button:hover {
      background-color: #8a6f5a;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      color: #79747E;
      font-size: 14px;
    }
    .booking-id {
      background-color: #f8f9fa;
      padding: 10px;
      border-radius: 5px;
      margin: 15px 0;
      font-size: 14px;
      color: #1C1B1F;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="reminder-container">
    <div class="header">
      <h1>NHẮC NHỞ CHECK-IN</h1>
      <p>Hệ thống đặt phòng khách sạn trực tuyến</p>
    </div>

    <div class="reminder-badge">
      <h2>⏰ Nhắc nhở quan trọng</h2>
      <p><strong>Ngày check-in của bạn là: ${formatDate(booking.checkInDate)}</strong></p>
      <p>${reminderMessage}</p>
    </div>

    <div class="booking-id">
      <strong>Mã đặt phòng:</strong> #BK${bookingIdShort}
    </div>

    <div class="section">
      <div class="section-title">Thông tin đặt phòng</div>
      <div class="booking-details">
        <div class="info-row">
          <span class="info-label">Khách sạn:</span>
          <span class="info-value"><strong>${hotel.name || 'N/A'}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Địa chỉ:</span>
          <span class="info-value">${hotelAddress}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Phòng:</span>
          <span class="info-value">${room.roomNumber || 'N/A'} - ${roomTypeName}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Ngày nhận phòng:</span>
          <span class="info-value"><strong>${formatDate(booking.checkInDate)}</strong></span>
        </div>
        <div class="info-row">
          <span class="info-label">Ngày trả phòng:</span>
          <span class="info-value">${formatDate(booking.checkOutDate)}</span>
        </div>
        <div class="info-row">
          <span class="info-label">Số đêm:</span>
          <span class="info-value">${nights} đêm</span>
        </div>
        <div class="info-row">
          <span class="info-label">Tổng thanh toán:</span>
          <span class="info-value"><strong>${formatPrice(booking.totalAmount)}</strong></span>
        </div>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Thông tin khách hàng</div>
      <div class="info-row">
        <span class="info-label">Họ và tên:</span>
        <span class="info-value">${guest.name || 'N/A'}</span>
      </div>
      <div class="info-row">
        <span class="info-label">Email:</span>
        <span class="info-value">${guest.email || 'N/A'}</span>
      </div>
      ${guest.phone ? `
      <div class="info-row">
        <span class="info-label">Số điện thoại:</span>
        <span class="info-value">${guest.phone}</span>
      </div>
      ` : ''}
    </div>

    ${booking.specialRequests ? `
    <div class="section">
      <div class="section-title">Yêu cầu đặc biệt</div>
      <p style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; color: #1C1B1F;">${booking.specialRequests}</p>
    </div>
    ` : ''}

    <a href="${bookingDetailUrl}" class="cta-button">
      Xem chi tiết đơn đặt phòng
    </a>

    <div class="footer">
      <p><strong>Chúng tôi rất mong được đón tiếp bạn!</strong></p>
      <p>Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi qua email hoặc hotline.</p>
      <p style="margin-top: 20px; color: #79747E; font-size: 12px;">
        Đây là email tự động, vui lòng không trả lời email này.
      </p>
    </div>
  </div>
</body>
</html>
    `;

    return await sendEmail(guest.email, subject, html);
  } catch (error) {
    console.error('Lỗi khi gửi email nhắc nhở check-in:', error);
    return false;
  }
};

/**
 * Gửi email thông báo đã hoàn tiền cho khách, kèm ảnh minh chứng.
 * @param {Object} booking - Booking đã populate guest/hotel/room
 * @param {String} refundProofImageUrl - URL ảnh minh chứng hoàn tiền (public URL)
 * @returns {Promise<Boolean>}
 */
const sendRefundProcessedEmail = async (booking, refundProofImageUrl = "") => {
  try {
    const guest = booking?.guest;
    const hotel = booking?.hotel;
    if (!guest?.email) {
      return false;
    }

    const bookingIdShort = String(booking._id || "").slice(-8).toUpperCase();
    const amount = Number(booking.finalAmount ?? booking.totalAmount ?? 0);
    const amountStr = new Intl.NumberFormat("vi-VN").format(amount);
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
    const bookingDetailUrl = `${frontendUrl}/my-bookings?bookingId=${booking._id}`;

    const proofHtml = refundProofImageUrl
      ? `
      <div style="margin-top:16px;padding:16px;border:1px solid #e6e6e6;border-radius:8px;background:#fafafa;text-align:center;">
        <div style="font-size:14px;font-weight:600;color:#1C1B1F;margin-bottom:10px;">Minh chứng hoàn tiền từ khách sạn</div>
        <div style="font-size:13px;line-height:1.7;color:#444;">
          Vui lòng mở ảnh minh chứng tại link bên dưới:<br />
          <a href="${refundProofImageUrl}" target="_blank" rel="noopener noreferrer" style="color:#0d6efd;word-break:break-all;">${refundProofImageUrl}</a>
        </div>
      </div>
      `
      : `
      <div style="margin-top:16px;padding:12px 14px;border:1px solid #f0d9a7;border-radius:8px;background:#fff8e8;color:#7a5b18;font-size:13px;line-height:1.6;text-align:center;">
        Khách sạn đã xác nhận hoàn tiền nhưng chưa đính kèm ảnh minh chứng trong hệ thống.
      </div>`;

    const html = `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f6f8;font-family:Arial,sans-serif;color:#1C1B1F;">
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f4f6f8;padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="620" style="max-width:620px;width:100%;background:#ffffff;border:1px solid #ececec;border-radius:12px;overflow:hidden;">
            <tr>
              <td style="padding:24px 24px 16px;background:#fffaf5;border-bottom:1px solid #f0e5d8;text-align:center;">
                <h2 style="margin:0;font-size:22px;line-height:1.3;color:#A0826D;">Thông báo hoàn tiền đơn đặt phòng</h2>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 24px 8px;font-size:15px;line-height:1.7;color:#333;text-align:center;">
                Đơn <strong>#BK${bookingIdShort}</strong> tại <strong>${hotel?.name || "khách sạn"}</strong> đã được xác nhận hoàn tiền.
              </td>
            </tr>
            <tr>
              <td style="padding:10px 24px 0;" align="center">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e7e9ec;border-radius:8px;background:#f9fafb;">
                  <tr>
                    <td style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:14px;color:#79747E;width:50%;text-align:right;font-weight:600;">
                      Số tiền hoàn:
                    </td>
                    <td style="padding:12px 14px;border-bottom:1px solid #eceff3;font-size:14px;color:#1C1B1F;width:50%;text-align:left;">
                      ${amountStr} VNĐ
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:12px 14px;font-size:14px;color:#79747E;text-align:right;font-weight:600;">
                      Phương thức thanh toán ban đầu:
                    </td>
                    <td style="padding:12px 14px;font-size:14px;color:#1C1B1F;text-align:left;">
                      ${booking.paymentMethod === "vnpay" ? "VNPay" : "QR chuyển khoản"}
                    </td>
                  </tr>
                </table>
                ${proofHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:18px 24px 0;font-size:14px;line-height:1.7;color:#333;text-align:center;">
                Bạn có thể xem lại chi tiết đơn tại:<br />
                <a href="${bookingDetailUrl}" style="color:#0d6efd;word-break:break-all;">${bookingDetailUrl}</a>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 24px 24px;font-size:13px;line-height:1.7;color:#6d7278;text-align:center;">
                Nếu đã quá thời gian mà bạn chưa nhận tiền, vui lòng liên hệ trực tiếp khách sạn để được hỗ trợ.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

    return await sendEmail(guest.email, `Đã hoàn tiền đơn #BK${bookingIdShort}`, html);
  } catch (error) {
    console.error("Lỗi khi gửi email hoàn tiền:", error);
    return false;
  }
};

module.exports = {
  sendReceiptEmail,
  sendCheckInReminderEmail,
  sendRefundProcessedEmail,
};
