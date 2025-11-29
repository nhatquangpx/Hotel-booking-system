import api from '../config/axios';

export const ownerRoomAPI = {
  // Lấy danh sách phòng của khách sạn
  getHotelRooms: async (hotelId) => {
    try {
      const response = await api.get(`/owner/hotels/${hotelId}/rooms`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết phòng
  getRoomById: async (id) => {
    try {
      const response = await api.get(`/owner/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo phòng mới
  createRoom: async (hotelId, roomData) => {
    try {
      const response = await api.post(`/owner/hotels/${hotelId}/rooms`, roomData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin phòng
  updateRoom: async (id, roomData) => {
    try {
      const response = await api.put(`/owner/rooms/${id}`, roomData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa phòng
  deleteRoom: async (id) => {
    try {
      const response = await api.delete(`/owner/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

};

export default ownerRoomAPI; 