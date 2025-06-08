import api from '../config/axios';

export const adminRoomAPI = {
  // Lấy tất cả phòng
  getAllRooms: async () => {
    try {
      const response = await api.get('/admins/rooms');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết phòng
  getRoomById: async (id) => {
    try {
      const response = await api.get(`/admins/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo phòng mới
  createRoom: async (roomData) => {
    try {
      const response = await api.post('/admins/rooms', roomData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật thông tin phòng
  updateRoom: async (id, roomData) => {
    try {
      const response = await api.put(`/admins/rooms/${id}`, roomData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Xóa phòng
  deleteRoom: async (id) => {
    try {
      const response = await api.delete(`/admins/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật trạng thái phòng
  updateRoomStatus: async (id, status) => {
    try {
      const response = await api.put(`/admins/rooms/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default adminRoomAPI; 