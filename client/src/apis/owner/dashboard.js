import api from '../config/axios';

export const ownerDashboardAPI = {
  // Lấy thống kê tổng quan
  getStats: async () => {
    try {
      const response = await api.get('/owner/dashboard/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy doanh thu tuần này
  getWeeklyRevenue: async () => {
    try {
      const response = await api.get('/owner/dashboard/revenue');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy công suất phòng
  getRoomOccupancy: async () => {
    try {
      const response = await api.get('/owner/dashboard/rooms');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách công việc hôm nay
  getTodayTasks: async () => {
    try {
      const response = await api.get('/owner/dashboard/tasks');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin khách sạn
  getHotelInfo: async () => {
    try {
      const response = await api.get('/owner/hotels');
      // Lấy khách sạn đầu tiên nếu có nhiều
      const hotels = response.data;
      if (Array.isArray(hotels) && hotels.length > 0) {
        return hotels[0];
      }
      return hotels;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default ownerDashboardAPI;

