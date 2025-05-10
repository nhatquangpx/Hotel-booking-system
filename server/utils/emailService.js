const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "Gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false
  }
});

// Verify transporter configuration
transporter.verify(function(error, success) {
  if (error) {
    console.log("Email configuration error:", error);
  } else {
    console.log("Email server is ready to send messages");
  }
});

const sendEmail = async (to, subject, html) => {
  try {
    const mailOptions = {
      to,
      subject,
      html,
    };
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
};

const sendNewPasswordEmail = async (to, newPassword) => {
  const subject = "Mật khẩu mới của bạn";
  const html = `
    <p>Xin chào,</p>
    <p>Đây là mật khẩu mới được tạo cho tài khoản của bạn:</p>
    <h3>${newPassword}</h3>
    <p>Vui lòng đăng nhập bằng mật khẩu này và đổi lại mật khẩu sau khi đăng nhập để đảm bảo an toàn.</p>
    <p>Trân trọng,</p>
    <p>Đội ngũ hỗ trợ của bạn</p>
  `;
  return sendEmail(to, subject, html);
};

const sendReceiptEmail = async (to, orderDetails) => {
  const subject = `Biên lai thanh toán - Đơn hàng #${orderDetails.orderId || 'Không xác định'}`;
  const html = `
    <p>Xin chào,</p>
    <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi. Dưới đây là chi tiết đơn hàng của bạn:</p>
    <ul>
      ${orderDetails.items.map(item => `<li>${item.name}: ${item.quantity} x ${item.price} = ${item.total}</li>`).join('')}
    </ul>
    <p>Tổng cộng: <strong>${orderDetails.totalAmount}</strong></p>
    <p>Phương thức thanh toán: ${orderDetails.paymentMethod || 'Không xác định'}</p>
    <p>Ngày thanh toán: ${orderDetails.paymentDate || new Date().toLocaleDateString()}</p>
    <p>Trân trọng,</p>
    <p>Đội ngũ của bạn</p>
  `;
  return sendEmail(to, subject, html);
};

module.exports = {
  sendEmail,
  sendNewPasswordEmail,
  sendReceiptEmail,
};