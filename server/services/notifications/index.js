/**
 * Notification services
 *
 * - core.js      → tạo thông báo (cá nhân + theo khách sạn)
 * - readState.js → readBy (đã đọc / chưa đọc)
 * - inbox.js     → danh sách, đếm, đánh dấu đã đọc
 * - owner.js     → sự kiện KS → createHotelNotification (recipientRole: hotel)
 * - guest.js, admin.js → thông báo theo role
 */

const core = require("./core");
const ownerNotifications = require("./owner");
const guestNotifications = require("./guest");
const adminNotifications = require("./admin");

module.exports = {
  ...core,
  ...ownerNotifications,
  ...guestNotifications,
  ...adminNotifications,
};
