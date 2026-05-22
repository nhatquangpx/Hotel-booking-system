import api from '../config/axios';

/**
 * Generic Notification API Service
 * Works for all roles (owner, admin, guest)
 */
export const createNotificationAPI = (apiPrefix) => ({
  // Lấy danh sách thông báo với phân trang
  getNotifications: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`${apiPrefix}/notifications`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy số lượng thông báo chưa đọc
  getUnreadCount: async () => {
    try {
      const response = await api.get(`${apiPrefix}/notifications/unread-count`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Đánh dấu thông báo là đã đọc
  markAsRead: async (notificationId) => {
    try {
      const response = await api.put(`${apiPrefix}/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Đánh dấu tất cả thông báo là đã đọc
  markAllAsRead: async () => {
    try {
      const response = await api.put(`${apiPrefix}/notifications/read-all`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tải thêm thông báo (phân trang)
  loadMoreNotifications: async (page = 1, limit = 10) => {
    try {
      const response = await api.get(`${apiPrefix}/notifications/load-more`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
});

// Export pre-configured APIs for each role
export const ownerNotificationAPI = createNotificationAPI('/owner');
export const staffNotificationAPI = createNotificationAPI('/staff');
export const adminNotificationAPI = createNotificationAPI('/admin');
export const guestNotificationAPI = createNotificationAPI('/guest');

export default {
  owner: ownerNotificationAPI,
  staff: staffNotificationAPI,
  admin: adminNotificationAPI,
  guest: guestNotificationAPI,
  create: createNotificationAPI
};

