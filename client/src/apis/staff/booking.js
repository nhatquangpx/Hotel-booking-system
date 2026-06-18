import api from '../config/axios';
import { unwrapPaginated } from '@/shared/utils/paginationResponse';

export const staffBookingAPI = {
  getBookings: async (params = {}) => {
    try {
      const response = await api.get('/staff/bookings', { params });
      return unwrapPaginated(response.data, 'bookings');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getBookingById: async (id) => {
    try {
      const response = await api.get(`/staff/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  checkIn: async (id) => {
    try {
      const response = await api.post(`/staff/bookings/${id}/check-in`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  checkOut: async (id) => {
    try {
      const response = await api.post(`/staff/bookings/${id}/check-out`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default staffBookingAPI;
