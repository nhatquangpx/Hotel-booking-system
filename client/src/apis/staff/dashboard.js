import api from '../config/axios';

function throwDashboardApiError(error, defaultMessage) {
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

export const staffDashboardAPI = {
  getDashboard: async () => {
    try {
      const response = await api.get('/staff/dashboard');
      return response.data;
    } catch (error) {
      throwDashboardApiError(error, 'Có lỗi xảy ra khi tải tổng quan');
    }
  },
};

export default staffDashboardAPI;
