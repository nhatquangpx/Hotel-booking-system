import api from '../config/axios';

export const bookingAPI = {
  // Lấy tất cả đặt phòng của người dùng
  getUserBookings: async () => {
    try {
      const response = await api.get('/guests/bookings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết đặt phòng
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/guests/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo đặt phòng mới
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/guests/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Hủy đặt phòng
  cancelBooking: async (id, reason) => {
    try {
      const response = await api.put(`/guests/bookings/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Thêm đánh giá cho đặt phòng
  addReview: async (id, reviewData) => {
    try {
      const response = await api.put(`/guests/bookings/${id}/review`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default bookingAPI; 