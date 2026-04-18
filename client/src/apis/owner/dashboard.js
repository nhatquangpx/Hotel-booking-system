import api from '../config/axios';

const hotelParams = (hotelId) => {
  const params = {};
  if (hotelId) params.hotelId = hotelId;
  return { params };
};

export const ownerDashboardAPI = {
  // Lấy thống kê tổng quan
  getStats: async (hotelId) => {
    try {
      const response = await api.get('/owner/dashboard/stats', hotelParams(hotelId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy doanh thu tuần này
  getWeeklyRevenue: async (hotelId) => {
    try {
      const response = await api.get('/owner/dashboard/revenue', hotelParams(hotelId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy công suất phòng
  getRoomOccupancy: async (hotelId) => {
    try {
      const response = await api.get('/owner/dashboard/rooms', hotelParams(hotelId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách công việc hôm nay
  getTodayTasks: async (hotelId) => {
    try {
      const response = await api.get('/owner/dashboard/tasks', hotelParams(hotelId));
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin khách sạn (đã chọn trong context hoặc mặc định đầu tiên)
  getHotelInfo: async (hotelId) => {
    try {
      const response = await api.get('/owner/hotels');
      const hotels = response.data;
      if (!Array.isArray(hotels) || hotels.length === 0) {
        return null;
      }
      if (hotelId) {
        const hit = hotels.find((h) => String(h._id) === String(hotelId));
        return hit || hotels[0];
      }
      return hotels[0];
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default ownerDashboardAPI;

