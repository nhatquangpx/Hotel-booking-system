import api from '../config/axios';
import { unwrapPaginated } from '@/shared/utils/core/paginationResponse';

export const ownerBookingAPI = {
  getOwnerBookings: async (params = {}) => {
    try {
      const response = await api.get('/owner/bookings', { params });
      return unwrapPaginated(response.data, 'bookings');
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

  // Check-out đặt phòng (payload tùy chọn khi checkout quá hạn)
  checkOut: async (id, payload = null) => {
    try {
      const response = await api.post(`/owner/bookings/${id}/check-out`, payload || {});
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

  /** Từ chối / xử lý minh chứng QR — rejectionType: invalid_proof | payment_not_successful */
  rejectQrPayment: async (id, rejectionType) => {
    try {
      const response = await api.post(`/owner/bookings/${id}/reject-qr-payment`, { rejectionType });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  /** Mở lại đơn đã hủy (tiền về chậm, lỗi cổng thanh toán, …) */
  reopenCancelledBooking: async (id, reason = '') => {
    try {
      const response = await api.post(`/owner/bookings/${id}/reopen`, {
        reason: reason || undefined,
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getSensitiveMediaBlob: async (id, kind) => {
    const response = await api.get(`/owner/bookings/${id}/sensitive-media/${kind}`, {
      responseType: 'blob',
    });
    return response.data;
  },
};

export default ownerBookingAPI; 