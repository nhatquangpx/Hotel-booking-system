import api from '../config/axios';

export const adminBookingAPI = {
  // Lấy tất cả đặt phòng
  getAllBookings: async () => {
    try {
      const response = await api.get('/admin/bookings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết đặt phòng
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/admin/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách đặt phòng của người dùng
  getUserBookings: async (userId) => {
    try {
      const response = await api.get(`/admin/bookings/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật trạng thái đặt phòng
  updateBookingStatus: async (id, status) => {
    try {
      const response = await api.put(`/admin/bookings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa đặt phòng
  deleteBooking: async (id) => {
    try {
      const response = await api.delete(`/admin/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default adminBookingAPI; 