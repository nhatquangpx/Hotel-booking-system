import api from '../config/axios';

export const guestAddonAPI = {
  getHotelAddons: async (hotelId) => {
    try {
      const response = await api.get(`/guest/hotels/${hotelId}/addon-services`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default guestAddonAPI;
