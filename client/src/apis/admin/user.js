import api from '../config/axios';
import { unwrapPaginated } from '@/shared/utils/core/paginationResponse';

export const adminUserAPI = {
  getAllUsers: async (params = {}) => {
    try {
      const response = await api.get('/admin/users', { params });
      if (params.view === 'hotel') {
        const data = response.data;
        return {
          items: data.hotelGroups || [],
          pagination: data.pagination,
          extra: {
            orphanStaff: data.orphanStaff || [],
            orphanOwners: data.orphanOwners || [],
            separateRoleGroups: data.separateRoleGroups || {},
          },
          raw: data,
        };
      }
      return unwrapPaginated(response.data, 'users');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getUserById: async (id) => {
    try {
      const response = await api.get(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createUser: async (userData) => {
    try {
      const response = await api.post('/admin/users', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateUser: async (id, userData) => {
    try {
      const response = await api.put(`/admin/users/${id}`, userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteUser: async (id) => {
    try {
      const response = await api.delete(`/admin/users/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateUserStatus: async (id, status) => {
    try {
      const response = await api.put(`/admin/users/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default adminUserAPI;
