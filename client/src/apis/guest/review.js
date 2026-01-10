import api from '../config/axios';

export const reviewAPI = {
  // Lấy đánh giá theo booking ID
  getReviewByBooking: async (bookingId) => {
    try {
      const response = await api.get(`/guest/reviews/booking/${bookingId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật đánh giá
  updateReview: async (reviewId, reviewData) => {
    try {
      const response = await api.put(`/guest/reviews/${reviewId}`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa đánh giá
  deleteReview: async (reviewId) => {
    try {
      const response = await api.delete(`/guest/reviews/${reviewId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách đánh giá của khách sạn
  getReviewsByHotel: async (hotelId, page = 1, limit = 10) => {
    try {
      const response = await api.get(`/guest/reviews/hotel/${hotelId}`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default reviewAPI;

