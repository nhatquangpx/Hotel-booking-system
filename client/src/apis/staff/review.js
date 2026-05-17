import api from '../config/axios';

function throwReviewApiError(error, defaultMessage) {
  const payload = error.response?.data;
  let message = defaultMessage;

  if (payload) {
    message =
      (typeof payload === 'object' && (payload.message || payload.error)) ||
      (typeof payload === 'string' ? payload : defaultMessage);
  } else if (error.request) {
    message = 'Không thể kết nối đến máy chủ. Vui lòng thử lại sau.';
  } else if (error.message) {
    message = error.message;
  }

  const err = new Error(message);
  if (payload && typeof payload === 'object') {
    err.data = payload;
  }
  throw err;
}

export const staffReviewAPI = {
  getReviews: async (page = 1, limit = 20) => {
    try {
      const response = await api.get('/staff/reviews', { params: { page, limit } });
      return response.data;
    } catch (error) {
      throwReviewApiError(error, 'Có lỗi xảy ra khi tải danh sách đánh giá');
    }
  },

  replyToReview: async (reviewId, response) => {
    try {
      const response_data = await api.put(`/staff/reviews/${reviewId}/reply`, { response });
      return response_data.data;
    } catch (error) {
      throwReviewApiError(error, 'Có lỗi xảy ra khi gửi phản hồi');
    }
  },

  deleteReply: async (reviewId) => {
    try {
      const response = await api.delete(`/staff/reviews/${reviewId}/reply`);
      return response.data;
    } catch (error) {
      throwReviewApiError(error, 'Có lỗi xảy ra khi xóa phản hồi');
    }
  },
};

export default staffReviewAPI;
