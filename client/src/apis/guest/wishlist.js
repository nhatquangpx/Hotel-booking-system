import api from '../config/axios';

export const guestWishlistAPI = {
  getWishlist: async () => {
    const response = await api.get('/guest/wishlist');
    return response.data;
  },

  toggleWishlist: async (hotelId) => {
    const response = await api.post(`/guest/wishlist/${hotelId}`);
    return response.data;
  },
};

export default guestWishlistAPI;
