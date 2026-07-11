import api from '../config/axios';

export const userAPI = {
  getUserProfile: async () => {
    try {
      const response = await api.get('/guest/profile');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /**
   * @param {object} userData
   * @param {{ front?: File|null, back?: File|null }} idImages
   */
  updateUserProfile: async (userData, idImages = {}) => {
    try {
      const { front, back } = idImages || {};
      if (front || back) {
        const fd = new FormData();
        Object.entries(userData || {}).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          fd.append(key, value);
        });
        if (front) fd.append('idImageFront', front);
        if (back) fd.append('idImageBack', back);
        const response = await api.put('/guest/profile', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      }
      const response = await api.put('/guest/profile', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /** Blob ảnh CCCD trên hồ sơ — side: 'front' | 'back' */
  getProfileIdImageBlob: async (side = 'front') => {
    const response = await api.get(`/guest/profile/id-image/${side}`, {
      responseType: 'blob',
    });
    const contentType = response.headers?.['content-type'] || '';
    if (contentType.includes('application/json')) {
      const text = await response.data.text();
      let message = 'Không thể tải ảnh CCCD';
      try {
        message = JSON.parse(text)?.message || message;
      } catch {
        /* ignore */
      }
      throw new Error(message);
    }
    return response.data;
  },

  changePassword: async (userData) => {
    try {
      const response = await api.put('/guest/profile/changepassword', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default userAPI;
