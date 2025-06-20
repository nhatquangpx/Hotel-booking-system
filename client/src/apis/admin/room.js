import api from '../config/axios';

export const adminRoomAPI = {
  // Lấy tất cả phòng
  getAllRooms: async () => {
    try {
      const response = await api.get('/admin/rooms');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  getRoomsByHotel: async (hotelId) => {
    try {
      const response = await api.get(`/admin/rooms/hotel/${hotelId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết phòng
  getRoomById: async (id) => {
    try {
      const response = await api.get(`/admin/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo phòng mới
  createRoom: async (roomData) => {
    try {
      const response = await api.post('/admin/rooms', roomData, {
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
      const response = await api.put(`/admin/rooms/${id}`, roomData, {
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
      const response = await api.delete(`/admin/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

};

export default adminRoomAPI; 