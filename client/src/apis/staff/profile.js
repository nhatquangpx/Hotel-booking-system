import api from '../config/axios';

export const staffProfileAPI = {
  getProfile: async () => {
    try {
      const response = await api.get('/staff/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/staff/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  changePassword: async (userData) => {
    try {
      const response = await api.put('/staff/profile/changepassword', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default staffProfileAPI;
