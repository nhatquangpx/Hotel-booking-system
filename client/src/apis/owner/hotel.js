import api from '../config/axios';

export const ownerHotelAPI = {
  // Lấy danh sách khách sạn của owner
  getOwnerHotels: async () => {
    try {
      const response = await api.get('/owner/hotels');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết khách sạn
  getHotelById: async (id) => {
    try {
      const response = await api.get(`/owner/hotels/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo khách sạn mới
  createHotel: async (hotelData) => {
    try {
      const response = await api.post('/owner/hotels', hotelData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin khách sạn
  updateHotel: async (id, hotelData) => {
    try {
      const response = await api.put(`/owner/hotels/${id}`, hotelData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa khách sạn
  deleteHotel: async (id) => {
    try {
      const response = await api.delete(`/owner/hotels/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật trạng thái khách sạn
  updateHotelStatus: async (id, status) => {
    try {
      const response = await api.put(`/owner/hotels/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default ownerHotelAPI; 