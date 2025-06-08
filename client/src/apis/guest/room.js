import api from '../config/axios';

export const roomAPI = {
  // Lấy tất cả phòng
  getAvailableRooms: async (hotelId, searchParams) => {
    try {
      const response = await api.get(`/hotels/${hotelId}/rooms`, { params: searchParams });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết phòng
  getRoomById: async (id) => {
    try {
      const response = await api.get(`/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default roomAPI; 