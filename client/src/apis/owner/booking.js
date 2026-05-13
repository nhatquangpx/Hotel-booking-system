import api from '../config/axios';

export const ownerBookingAPI = {
  // Cập nhật trạng thái đặt phòng
  getOwnerBookings: async (hotelId) => {
    try {
      const params = {};
      if (hotelId) params.hotelId = hotelId;
      const response = await api.get('/owner/bookings', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật trạng thái đặt phòng
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/owner/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật trạng thái đặt phòng
  updateBookingStatus: async (id, status) => {
    try {
      const response = await api.put(`/owner/bookings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Cập nhật trạng thái thanh toán
  getBookingStats: async () => {
    try {
      const response = await api.get('/owner/bookings/stats');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Check-in đặt phòng
  checkIn: async (id) => {
    try {
      const response = await api.post(`/owner/bookings/${id}/check-in`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Check-out đặt phòng
  checkOut: async (id) => {
    try {
      const response = await api.post(`/owner/bookings/${id}/check-out`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /** Xác nhận đã hoàn tiền cho đơn khách đã hủy (đủ điều kiện hoàn), kèm ảnh minh chứng. */
  confirmGuestRefund: async (id, proofImageFile) => {
    try {
      const fd = new FormData();
      if (proofImageFile) {
        fd.append('proofImage', proofImageFile);
      }
      const response = await api.post(`/owner/bookings/${id}/confirm-guest-refund`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default ownerBookingAPI; 