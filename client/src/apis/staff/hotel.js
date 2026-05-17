import api from '../config/axios';

/** Staff chỉ đọc email bên sửa chữa (chủ KS cấu hình). */
export const staffHotelAPI = {
  getMaintenanceContact: async () => {
    try {
      const response = await api.get('/staff/hotel/maintenance-contact');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default staffHotelAPI;
