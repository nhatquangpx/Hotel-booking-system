import api from '../config/axios';

export const ownerReviewAPI = {
  // Lấy danh sách đánh giá của các khách sạn thuộc về owner
  getOwnerReviews: async (page = 1, limit = 20, hotelId, rating = null) => {
    try {
      const params = { page, limit };
      if (hotelId) params.hotelId = hotelId;
      if (rating != null) params.rating = rating;
      const response = await api.get('/owner/reviews', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Phản hồi review (thêm hoặc cập nhật)
  replyToReview: async (reviewId, response) => {
    try {
      const response_data = await api.put(`/owner/reviews/${reviewId}/reply`, {
        response
      });
      return response_data.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa phản hồi
  deleteReply: async (reviewId) => {
    try {
      const response = await api.delete(`/owner/reviews/${reviewId}/reply`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default ownerReviewAPI;

