/**
 * Email Services
 * Centralized export for all email-related functions
 */

const { sendEmail } = require("./emailService");
const { sendNewPasswordEmail } = require("./authEmail");
const { sendReceiptEmail, sendCheckInReminderEmail } = require("./bookingEmail");
const { sendCheckInReminders, sendCheckInReminderIfNeeded } = require("./reminderEmailService");

module.exports = {
  // Core email service
  sendEmail,
  
  // Authentication emails
  sendNewPasswordEmail,
  
  // Booking emails
  sendReceiptEmail,
  sendCheckInReminderEmail,
  
  // Reminder email service
  sendCheckInReminders,
  sendCheckInReminderIfNeeded,
};
