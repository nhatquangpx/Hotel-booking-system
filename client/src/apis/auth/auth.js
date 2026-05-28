import api from '../config/axios';

export const authAPI = {
  getMe: async () => {
    try {
      const response = await api.get('/auth/me');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  logout: async () => {
    try {
      const response = await api.post('/auth/logout');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Đăng nhập
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Đăng ký
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Quên mật khẩu
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgotpassword', { email });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
  
  // Đặt lại mật khẩu
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/resetpassword', { token, newPassword });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 2FA
  verify2FA: async (userId, otpCode, rememberDevice = false) => {
    try {
      const response = await api.post('/auth/verify-2fa', { userId, otpCode, rememberDevice });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  resend2FAOTP: async (userId) => {
    try {
      const response = await api.post('/auth/resend-2fa-otp', { userId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // 2FA Settings
  get2FAStatus: async () => {
    try {
      const response = await api.get('/auth/2fa/status');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  enable2FA: async () => {
    try {
      const response = await api.post('/auth/2fa/enable');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  disable2FA: async () => {
    try {
      const response = await api.post('/auth/2fa/disable');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  regenerateBackupCodes: async () => {
    try {
      const response = await api.post('/auth/2fa/regenerate-backup-codes');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Trusted Devices
  getTrustedDevices: async () => {
    try {
      const response = await api.get('/auth/2fa/trusted-devices');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  removeTrustedDevice: async (deviceId) => {
    try {
      const response = await api.post('/auth/2fa/trusted-devices/remove', { deviceId });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  removeAllTrustedDevices: async () => {
    try {
      const response = await api.post('/auth/2fa/trusted-devices/remove-all');
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  }
};

export default authAPI; 