import api from '../config/axios';
import { unwrapPaginated } from '@/shared/utils/paginationResponse';

export const userHotelAPI = {
  getHotelCities: async () => {
    try {
      const response = await api.get('/guest/hotels/cities');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAllHotels: async (params = {}) => {
    try {
      const response = await api.get('/guest/hotels', { params });
      return unwrapPaginated(response.data, 'hotels');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getHotelByFilter: async (filters = {}) => {
    try {
      const response = await api.get('/guest/hotels/filter', { params: filters });
      return unwrapPaginated(response.data, 'hotels');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getHotelById: async (id, options = {}) => {
    try {
      const params = {};
      if (options.forBooking) {
        params.forBooking = 'true';
      }
      const response = await api.get(`/guest/hotels/${id}`, { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getFeaturedHotels: async () => {
    try {
      const response = await api.get('/guest/hotels/featured');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  searchHotels: async (searchParams) => {
    try {
      const response = await api.get('/guest/hotels/search', { params: searchParams });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default userHotelAPI;
