import api from '../config/axios';

export const userAPI = {
  // Lấy thông tin người dùng
  getUserProfile: async () => {
    try {
      const response = await api.get('/guest/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin người dùng
  updateUserProfile: async (userData) => {
    try {
      const response = await api.put('/guest/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Đổi mật khẩu
  changePassword: async (userData) => {
    try {
      const response = await api.put('/guest/profile/changepassword', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default userAPI; 