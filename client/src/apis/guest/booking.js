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

  // Tạo đặt phòng mới (có thể kèm ảnh CCCD 2 mặt)
  createBooking: async (bookingData, idImages = null) => {
    try {
      const front = idImages?.front;
      const back = idImages?.back;
      if (front || back) {
        const fd = new FormData();
        Object.entries(bookingData || {}).forEach(([key, value]) => {
          if (value === undefined || value === null) return;
          if (key === 'selectedAddonIds') {
            fd.append(
              'selectedAddonIds',
              JSON.stringify(Array.isArray(value) ? value : [])
            );
            return;
          }
          fd.append(key, value);
        });
        if (front) fd.append('idImageFront', front);
        if (back) fd.append('idImageBack', back);
        const response = await api.post('/guest/bookings', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
      }
      const response = await api.post('/guest/bookings', bookingData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /** Tải ảnh nhạy cảm (minh chứng / CCCD) */
  getSensitiveMediaBlob: async (id, kind) => {
    const response = await api.get(`/guest/bookings/${id}/sensitive-media/${kind}`, {
      responseType: 'blob',
    });
    return response.data;
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
  getPricePreview: async ({ hotelId, roomId, checkInDate, checkOutDate, guestCount, selectedAddonIds }) => {
    try {
      const response = await api.get('/guest/bookings/price-preview', {
        params: {
          hotelId,
          roomId,
          checkInDate,
          checkOutDate,
          guestCount,
          selectedAddonIds: selectedAddonIds?.length ? selectedAddonIds.join(',') : undefined,
        },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default userBookingAPI; 