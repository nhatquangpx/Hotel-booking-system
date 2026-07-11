import api from '../config/axios';

export const adminCancelAbuseAPI = {
  getFlags: async (params = {}) => {
    const response = await api.get('/admin/cancel-abuse-flags', { params });
    return response.data;
  },

  getFlagById: async (id) => {
    const response = await api.get(`/admin/cancel-abuse-flags/${id}`);
    return response.data;
  },

  reviewFlag: async (id, payload) => {
    const response = await api.put(`/admin/cancel-abuse-flags/${id}/review`, payload);
    return response.data;
  },
};

export default adminCancelAbuseAPI;
