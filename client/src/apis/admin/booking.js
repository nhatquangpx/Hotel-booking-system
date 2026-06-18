import api from '../config/axios';
import { unwrapPaginated } from '@/shared/utils/core/paginationResponse';

export const adminBookingAPI = {
  getAllBookings: async (params = {}) => {
    try {
      const response = await api.get('/admin/bookings', { params });
      if (params.view === 'hotel') {
        const data = response.data;
        return {
          items: data.hotelGroups || [],
          pagination: data.pagination,
          raw: data,
        };
      }
      return unwrapPaginated(response.data, 'bookings');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getBookingById: async (id) => {
    try {
      const response = await api.get(`/admin/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getUserBookings: async (userId) => {
    try {
      const response = await api.get(`/admin/bookings/user/${userId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default adminBookingAPI;
