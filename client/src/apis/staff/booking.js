import api from '../config/axios';

export const staffBookingAPI = {
  getBookings: async () => {
    try {
      const response = await api.get('/staff/bookings');
      return response.data;
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
