import api from '../config/axios';
import { unwrapPaginated } from '@/shared/utils/paginationResponse';

export const adminHotelAPI = {
  getAllHotels: async (params = {}) => {
    try {
      const response = await api.get('/admin/hotels', { params });
      return unwrapPaginated(response.data, 'hotels');
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getHotelById: async (id) => {
    try {
      const response = await api.get(`/admin/hotels/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  createHotel: async (hotelData) => {
    try {
      const response = await api.post('/admin/hotels', hotelData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateHotel: async (id, hotelData) => {
    try {
      const response = await api.put(`/admin/hotels/${id}`, hotelData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteHotel: async (id) => {
    try {
      const response = await api.delete(`/admin/hotels/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default adminHotelAPI;
