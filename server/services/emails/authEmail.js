const { sendEmail } = require("./emailService");

/**
 * Gửi email mật khẩu mới cho người dùng
 * @param {String} to - Email người nhận
 * @param {String} newPassword - Mật khẩu mới
 * @returns {Promise<Boolean>} - Success status
 */
const sendNewPasswordEmail = async (to, newPassword) => {
  const subject = "[Mật khẩu] Mật khẩu mới của bạn";
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

module.exports = {
  sendNewPasswordEmail,
};
