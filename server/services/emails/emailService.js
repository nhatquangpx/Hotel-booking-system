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

/**
 * Core email sending function
 * @param {String} to - Recipient email address
 * @param {String} subject - Email subject
 * @param {String} html - Email HTML content
 * @returns {Promise<Boolean>} - Success status
 */
const sendEmail = async (to, subject, html) => {
  try {
    const fromUser = process.env.EMAIL_USER;
    const mailOptions = {
      ...(fromUser ? { from: fromUser } : {}),
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

module.exports = {
  sendEmail,
  transporter,
};
