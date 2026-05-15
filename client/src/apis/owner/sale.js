import api from '../config/axios';

export const ownerSaleAPI = {
  list: async (hotelId) => {
    const response = await api.get('/owner/sales', { params: { hotelId } });
    return response.data;
  },

  create: async (body) => {
    const response = await api.post('/owner/sales', body);
    return response.data;
  },

  update: async (id, body) => {
    const response = await api.put(`/owner/sales/${id}`, body);
    return response.data;
  },

  setStatus: async (id, isActive) => {
    const response = await api.patch(`/owner/sales/${id}/status`, { isActive });
    return response.data;
  },

  close: async (id) => {
    const response = await api.delete(`/owner/sales/${id}`);
    return response.data;
  },
};

export default ownerSaleAPI;
