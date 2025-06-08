import api from '../config/axios';

export const ownerRoomAPI = {
  // Lấy danh sách phòng của khách sạn
  getHotelRooms: async (hotelId) => {
    try {
      const response = await api.get(`/owners/hotels/${hotelId}/rooms`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết phòng
  getRoomById: async (id) => {
    try {
      const response = await api.get(`/owners/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo phòng mới
  createRoom: async (hotelId, roomData) => {
    try {
      const response = await api.post(`/owners/hotels/${hotelId}/rooms`, roomData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin phòng
  updateRoom: async (id, roomData) => {
    try {
      const response = await api.put(`/owners/rooms/${id}`, roomData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa phòng
  deleteRoom: async (id) => {
    try {
      const response = await api.delete(`/owners/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

};

export default ownerRoomAPI; 