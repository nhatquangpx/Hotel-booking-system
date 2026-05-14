import api from '../config/axios';

export const ownerEquipmentAPI = {
  getByHotel: async (hotelId) => {
    try {
      const response = await api.get(`/owner/hotels/${hotelId}/room-equipment`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  postEquipment: async (roomId, payload) => {
    try {
      const response = await api.post(`/owner/rooms/${roomId}/equipment`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  patchEquipment: async (roomId, equipmentId, payload) => {
    try {
      const response = await api.patch(`/owner/rooms/${roomId}/equipment/${equipmentId}`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteEquipment: async (roomId, equipmentId) => {
    try {
      const response = await api.delete(`/owner/rooms/${roomId}/equipment/${equipmentId}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  postRepairRequest: async (hotelId, payload) => {
    try {
      const response = await api.post(`/owner/hotels/${hotelId}/equipment-repair-request`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default ownerEquipmentAPI;
