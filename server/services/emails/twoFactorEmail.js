const { sendEmail } = require('./emailService');

/**
 * Send 2FA OTP code via email
 * @param {String} email - Recipient email
 * @param {String} otpCode - 6-digit OTP code
 * @param {String} userName - User's name
 * @returns {Promise<Boolean>} - Success status
 */
const send2FAOTPEmail = async (email, otpCode, userName = '') => {
  try {
    const subject = '[Xác thực 2 lớp] Mã OTP đăng nhập';
    
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
    .email-container {
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
    .otp-box {
      background-color: #fffbe6;
      border: 2px solid #F5C842;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: 700;
      color: #B8941F;
      letter-spacing: 8px;
      font-family: 'Courier New', monospace;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      color: #79747E;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>XÁC THỰC 2 LỚP</h1>
      <p>Hệ thống đặt phòng khách sạn trực tuyến</p>
    </div>

    <p>Xin chào ${userName || 'Người dùng'},</p>
    
    <p>Bạn đang thực hiện đăng nhập vào tài khoản của mình. Vui lòng sử dụng mã xác thực sau để hoàn tất quá trình đăng nhập:</p>

    <div class="otp-box">
      <p style="margin: 0 0 10px 0; color: #79747E; font-size: 14px;">Mã xác thực của bạn:</p>
      <div class="otp-code">${otpCode}</div>
    </div>

    <div class="warning">
      <strong>⚠️ Lưu ý quan trọng:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Mã này chỉ có hiệu lực trong <strong>10 phút</strong></li>
        <li>Không chia sẻ mã này với bất kỳ ai</li>
        <li>Nếu bạn không thực hiện đăng nhập, vui lòng bỏ qua email này</li>
      </ul>
    </div>

    <p>Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này hoặc liên hệ với chúng tôi ngay lập tức.</p>

    <div class="footer">
      <p><strong>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</strong></p>
      <p>Đây là email tự động, vui lòng không trả lời email này.</p>
    </div>
  </div>
</body>
</html>
    `;

    return await sendEmail(email, subject, html);
  } catch (error) {
    console.error('Lỗi khi gửi email OTP 2FA:', error);
    return false;
  }
};

/**
 * Send 2FA backup codes via email
 * @param {String} email - Recipient email
 * @param {Array} backupCodes - Array of backup codes
 * @param {String} userName - User's name
 * @returns {Promise<Boolean>} - Success status
 */
const send2FABackupCodesEmail = async (email, backupCodes, userName = '') => {
  try {
    const subject = '[Xác thực 2 lớp] Mã dự phòng đăng nhập';
    
    const codesList = backupCodes.map(code => `<li style="font-family: 'Courier New', monospace; font-size: 16px; margin: 5px 0;"><strong>${code.code}</strong></li>`).join('');
    
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
    .email-container {
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
    .codes-box {
      background-color: #f8f9fa;
      border: 1px solid #dee2e6;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .warning {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e9ecef;
      color: #79747E;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="header">
      <h1>MÃ DỰ PHÒNG 2FA</h1>
      <p>Hệ thống đặt phòng khách sạn trực tuyến</p>
    </div>

    <p>Xin chào ${userName || 'Người dùng'},</p>
    
    <p>Dưới đây là các mã dự phòng cho xác thực 2 lớp của bạn. Hãy lưu trữ các mã này ở nơi an toàn:</p>

    <div class="codes-box">
      <ul style="list-style: none; padding: 0; margin: 0;">
        ${codesList}
      </ul>
    </div>

    <div class="warning">
      <strong>⚠️ Lưu ý quan trọng:</strong>
      <ul style="margin: 10px 0; padding-left: 20px;">
        <li>Mỗi mã chỉ có thể sử dụng <strong>một lần</strong></li>
        <li>Hãy lưu trữ các mã này ở nơi an toàn</li>
        <li>Không chia sẻ mã này với bất kỳ ai</li>
        <li>Sử dụng mã dự phòng khi bạn không thể nhận mã OTP qua email</li>
      </ul>
    </div>

    <div class="footer">
      <p><strong>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</strong></p>
      <p>Đây là email tự động, vui lòng không trả lời email này.</p>
    </div>
  </div>
</body>
</html>
    `;

    return await sendEmail(email, subject, html);
  } catch (error) {
    console.error('Lỗi khi gửi email backup codes 2FA:', error);
    return false;
  }
};

module.exports = {
  send2FAOTPEmail,
  send2FABackupCodesEmail
};
