/**
 * Notification Service - Main Export
 * Centralized export for all notification services
 * 
 * Structure:
 * - core.js: Core notification creation function
 * - owner.js: Owner-specific notifications
 * - guest.js: Guest-specific notifications
 * - admin.js: Admin-specific notifications (future)
 */

const { createNotification } = require("./core");
const ownerNotifications = require("./owner");
const guestNotifications = require("./guest");
const adminNotifications = require("./admin");

module.exports = {
  // Core function
  createNotification,
  
  // Owner notifications
  ...ownerNotifications,
  
  // Guest notifications
  ...guestNotifications,
  
  // Admin notifications
  ...adminNotifications
};
