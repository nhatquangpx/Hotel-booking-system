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

module.exports = {
  // Core function
  createNotification,
  
  // Owner notifications
  ...ownerNotifications,
  
  // Guest notifications
  ...guestNotifications
  
  // Admin notifications can be added here in the future
};
