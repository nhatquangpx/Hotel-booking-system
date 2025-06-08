import api from '../config/axios';

export const adminHotelAPI = {
  // Lấy danh sách khách sạn
  getAllHotels: async () => {
    try {
      const response = await api.get('/admins/hotels');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết khách sạn
  getHotelById: async (id) => {
    try {
      const response = await api.get(`/admins/hotels/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo khách sạn mới
  createHotel: async (hotelData) => {
    try {
      const response = await api.post('/admins/hotels', hotelData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin khách sạn
  updateHotel: async (id, hotelData) => {
    try {
      const response = await api.put(`/admins/hotels/${id}`, hotelData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa khách sạn
  deleteHotel: async (id) => {
    try {
      const response = await api.delete(`/admins/hotels/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default adminHotelAPI; 