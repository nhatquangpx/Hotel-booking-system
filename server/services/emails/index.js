/**
 * Email Services
 * Centralized export for all email-related functions
 */

const { sendEmail } = require("./emailService");
const { sendNewPasswordEmail } = require("./authEmail");
const { sendReceiptEmail } = require("./bookingEmail");

module.exports = {
  // Core email service
  sendEmail,
  
  // Authentication emails
  sendNewPasswordEmail,
  
  // Booking emails
  sendReceiptEmail,
};
