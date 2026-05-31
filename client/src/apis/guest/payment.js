import api from '../config/axios';

export const paymentAPI = {
  // Tạo VNPay payment URL
  createVNPayPaymentUrl: async (bookingId) => {
    try {
      const response = await api.post('/payment/vnpay/create-payment-url', {
        bookingId
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Guest xác nhận đã chuyển khoản QR, chờ khách sạn đối soát
  confirmQrPayment: async ({ bookingId, proofImage } = {}) => {
    try {
      const formData = new FormData();
      formData.append('bookingId', String(bookingId ?? ''));
      if (proofImage) {
        formData.append('proofImage', proofImage);
      }
      const response = await api.post('/payment/qr/confirm-payment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy danh sách payment transactions
  getPaymentTransactions: async (params = {}) => {
    try {
      const response = await api.get('/payment/transactions', { params });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Lấy chi tiết payment transaction
  getPaymentTransactionById: async (id) => {
    try {
      const response = await api.get(`/payment/transactions/${id}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default paymentAPI;

