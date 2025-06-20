import api from '../config/axios';

export const adminHotelAPI = {
  // Lấy danh sách khách sạn
  getAllHotels: async () => {
    try {
      const response = await api.get('/admin/hotels');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết khách sạn
  getHotelById: async (id) => {
    try {
      const response = await api.get(`/admin/hotels/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo khách sạn mới
  createHotel: async (hotelData) => {
    try {
      const response = await api.post('/admin/hotels', hotelData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin khách sạn
  updateHotel: async (id, hotelData) => {
    try {
      const response = await api.put(`/admin/hotels/${id}`, hotelData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa khách sạn
  deleteHotel: async (id) => {
    try {
      const response = await api.delete(`/admin/hotels/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default adminHotelAPI; 