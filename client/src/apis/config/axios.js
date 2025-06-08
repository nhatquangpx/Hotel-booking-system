import axios from 'axios';

const API_URL = 'http://localhost:8001/api';

// Tạo instance axios với config mặc định
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào header mỗi request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xử lý các lỗi chung
    if (error.response) {
      // Lỗi từ server với response
      if (error.response.status === 401) {
        // Unauthorized - Token hết hạn hoặc không hợp lệ
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    } else if (error.request) {
      // Không nhận được response
      console.error('Network Error', error.request);
    } else {
      // Lỗi khác
      console.error('Error', error.message);
    }
    return Promise.reject(error);
  }
);

// Hàm xử lý lỗi chung
export const handleApiError = (error, defaultMessage) => {
  console.log('API Error:', error);
  
  if (error.response) {
    // Nếu server trả về response với lỗi
    console.log('Response data:', error.response.data);
    console.log('Response status:', error.response.status);
    
    const errorMsg = 
      error.response.data?.message || 
      error.response.data?.error ||
      (error.response.data && typeof error.response.data === 'string' ? error.response.data : null) ||
      defaultMessage;
    
    throw new Error(errorMsg);
  } else if (error.request) {
    // Nếu không nhận được response
    console.log('Request error:', error.request);
    throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
  } else {
    // Lỗi khác
    console.log('Error message:', error.message);
    throw new Error(error.message || defaultMessage);
  }
};

export default api; 