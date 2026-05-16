import api from '../config/axios';

export const staffRoomAPI = {
  getHotelRooms: async () => {
    try {
      const response = await api.get('/staff/rooms');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getRoomById: async (id) => {
    try {
      const response = await api.get(`/staff/rooms/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  updateRoomStatus: async (id, roomStatus) => {
    try {
      const response = await api.patch(`/staff/rooms/${id}/room-status`, { roomStatus });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default staffRoomAPI;
