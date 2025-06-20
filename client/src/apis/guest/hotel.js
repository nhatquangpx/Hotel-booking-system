import api from '../config/axios';

export const userHotelAPI = {
  // Lấy tất cả khách sạn
  getAllHotels: async () => {
    try {
      const response = await api.get('/guest/hotels');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy khách sạn theo bộ lọc
  getHotelByFilter: async (filters) => {
    try {
      const response = await api.get('/guest/hotels/filter', { params: filters });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết khách sạn
  getHotelById: async (id) => {
    try {
      const response = await api.get(`/guest/hotels/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách khách sạn nổi bật
  getFeaturedHotels: async () => {
    try {
      const response = await api.get('/guest/hotels/featured');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tìm kiếm khách sạn
  searchHotels: async (searchParams) => {
    try {
      const response = await api.get('/guest/hotels/search', { params: searchParams });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default userHotelAPI; 