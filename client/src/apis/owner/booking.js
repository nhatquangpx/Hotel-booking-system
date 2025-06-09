import api from '../config/axios';

export const ownerBookingAPI = {
  // Cập nhật trạng thái đặt phòng
  getOwnerBookings: async () => {
    try {
      const response = await api.get('/owner/bookings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật trạng thái đặt phòng
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/owner/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật trạng thái đặt phòng
  updateBookingStatus: async (id, status) => {
    try {
      const response = await api.put(`/owner/bookings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật trạng thái thanh toán
  getBookingStats: async () => {
    try {
      const response = await api.get('/owner/bookings/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default ownerBookingAPI; 