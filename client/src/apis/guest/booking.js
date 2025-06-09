import api from '../config/axios';

export const userBookingAPI = {
  // Lấy tất cả đặt phòng của người dùng
  getUserBookings: async () => {
    try {
      const response = await api.get('/guest/bookings');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết đặt phòng
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/guest/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo đặt phòng mới
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/guest/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Hủy đặt phòng
  cancelBooking: async (id, reason) => {
    try {
      const response = await api.put(`/guest/bookings/${id}/cancel`, { reason });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Thêm đánh giá cho đặt phòng
  addReview: async (id, reviewData) => {
    try {
      const response = await api.put(`/guest/bookings/${id}/review`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default userBookingAPI; 