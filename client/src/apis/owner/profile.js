import api from '../config/axios';

export const ownerProfileAPI = {
  // Lấy thông tin profile của owner
  getProfile: async () => {
    try {
      const response = await api.get('/owner/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/owner/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default ownerProfileAPI;

