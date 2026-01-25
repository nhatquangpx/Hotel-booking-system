import api from '../config/axios';

export const adminProfileAPI = {
  // Lấy thông tin profile của admin
  getProfile: async () => {
    try {
      const response = await api.get('/admin/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/admin/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default adminProfileAPI;
