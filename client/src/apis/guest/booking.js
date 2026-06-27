import api from '../config/axios';
import { unwrapPaginated } from '@/shared/utils/core/paginationResponse';

export const userBookingAPI = {
  /** Danh sách đặt phòng (lọc khách sạn, khoảng ngày nhận phòng, phân trang). */
  getMyBookings: async (params = {}) => {
    try {
      const response = await api.get('/guest/bookings', { params });
      const { items, pagination } = unwrapPaginated(response.data, 'bookings');
      return {
        items,
        pagination,
        filterHotels: response.data?.filterHotels ?? [],
      };
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy thông tin chi tiết đặt phòng
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/guest/bookings/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Tạo đặt phòng mới
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/guest/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Hủy đặt phòng (body: cancellationReason, refundBankAccountName, refundBankAccountNumber, refundBankName)
  cancelBooking: async (id, body) => {
    try {
      const payload =
        typeof body === 'string' ? { cancellationReason: body } : body || {};
      const response = await api.put(`/guest/bookings/${id}/cancel`, payload);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Thêm đánh giá cho đặt phòng
  addReview: async (id, reviewData) => {
    try {
      const response = await api.put(`/guest/bookings/${id}/review`, reviewData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách phòng trống theo ngày và khách sạn
  getAvailableRooms: async (hotelId, checkInDate, checkOutDate) => {
    try {
      const response = await api.get('/guest/bookings/available-rooms', {
        params: { hotelId, checkInDate, checkOutDate }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /** Xem trước giá (server) — cùng logic khi tạo đặt phòng */
  getPricePreview: async ({ hotelId, roomId, checkInDate, checkOutDate }) => {
    try {
      const response = await api.get('/guest/bookings/price-preview', {
        params: { hotelId, roomId, checkInDate, checkOutDate },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default userBookingAPI; 