import api from '../config/axios';

export const userAPI = {
  // Lấy thông tin người dùng
  getUserProfile: async () => {
    try {
      const response = await api.get('/guests/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin người dùng
  updateUserProfile: async (userData) => {
    try {
      const response = await api.put('/guests/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default userAPI; 