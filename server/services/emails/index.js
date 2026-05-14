/**
 * Email Services
 * Centralized export for all email-related functions
 */

const { sendEmail } = require("./emailService");
const { sendNewPasswordEmail } = require("./authEmail");
const { sendReceiptEmail, sendCheckInReminderEmail, sendRefundProcessedEmail } = require("./bookingEmail");
const { sendMaintenanceRepairRequestEmail } = require("./maintenanceRepairEmail");
const { sendCheckInReminders, sendCheckInReminderIfNeeded } = require("./reminderEmailService");
const { send2FAOTPEmail, send2FABackupCodesEmail } = require("./twoFactorEmail");

module.exports = {
  // Core email service
  sendEmail,
  
  // Authentication emails
  sendNewPasswordEmail,
  
  // Booking emails
  sendReceiptEmail,
  sendCheckInReminderEmail,
  sendRefundProcessedEmail,
  sendMaintenanceRepairRequestEmail,
  
  // Reminder email service
  sendCheckInReminders,
  sendCheckInReminderIfNeeded,
  
  // 2FA emails
  send2FAOTPEmail,
  send2FABackupCodesEmail,
};
