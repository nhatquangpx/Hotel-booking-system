import api from '../config/axios';

export const userAPI = {
  // Lấy thông tin người dùng
  getUserProfile: async (id) => {
    try {
      const response = await api.get(`/guest/profile/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin người dùng
  updateUserProfile: async (id, userData) => {
    try {
      const response = await api.put(`/guest/profile/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Đổi mật khẩu
  changePassword: async (id, userData) => {
    try {
      const response = await api.put(`/guest/profile/${id}/changepassword`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default userAPI; 