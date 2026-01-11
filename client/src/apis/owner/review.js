import api from '../config/axios';

export const ownerReviewAPI = {
  // Lấy danh sách đánh giá của các khách sạn thuộc về owner
  getOwnerReviews: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/owner/reviews', {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default ownerReviewAPI;

