import axios from 'axios';

const BASE_URL = 'http://localhost:8001/api';

// Tạo instance axios với config mặc định
const api = axios.create({
  baseURL: BASE_URL,
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
const handleApiError = (error, defaultMessage) => {
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

// API Authentication
export const authAPI = {
  // Đăng nhập
  login: async (email, password) => {
    if (!email || !password) {
      throw new Error('Email và mật khẩu không được để trống');
    }
    
    try {
      console.log('Login attempt with:', { email });
      
      // Đảm bảo dữ liệu được gửi đúng định dạng
      const loginData = {
        email: email.trim(),
        password: password
      };
      
      console.log('Login data being sent:', loginData);
      
      const response = await api.post('/auth/login', loginData);
      console.log('Login response:', response.data);
      return response.data;
    } catch (error) {
      console.error('Login error details:', error);
      
      if (error.response) {
        // Xử lý lỗi 422 - Validation errors
        if (error.response.status === 422) {
          console.log("Validation error:", error.response.data);
          
          // Kiểm tra nếu là string
          if (typeof error.response.data === 'string') {
            throw new Error(error.response.data);
          }
          
          // Kiểm tra nếu có mảng errors
          if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
            const errorMessages = error.response.data.errors.map(err => err.msg || err.message || JSON.stringify(err)).join(', ');
            throw new Error(errorMessages || 'Thông tin đăng nhập không hợp lệ');
          }
          
          const errorMsg = 
            error.response.data?.message || 
            error.response.data?.error ||
            JSON.stringify(error.response.data) ||
            'Thông tin đăng nhập không hợp lệ';
          
          throw new Error(errorMsg);
        }
        
        // Xử lý lỗi 401 - Unauthorized
        if (error.response.status === 401) {
          throw new Error('Email hoặc mật khẩu không chính xác');
        }
        
        // Xử lý các lỗi HTTP khác
        const errorMsg = 
          error.response.data?.message || 
          error.response.data?.error ||
          `Lỗi đăng nhập (${error.response.status})`;
        
        throw new Error(errorMsg);
      }
      
      // Lỗi kết nối hoặc lỗi khác
      throw new Error('Không thể kết nối đến máy chủ. Vui lòng thử lại sau.');
    }
  },
  
  // Đăng ký
  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Đăng ký thất bại!');
      throw error;
    }
  },
  
  // Quên mật khẩu
  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgotpassword', { email });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Gửi email khôi phục thất bại!');
    }
  },
  
  // Đặt lại mật khẩu
  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/resetpassword', { token, newPassword });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Đặt lại mật khẩu thất bại!');
    }
  },
};

// API Hotel
export const hotelAPI = {
  // Lấy tất cả khách sạn
  getAllHotels: async (filters = {}) => {
    try {
      const response = await api.get('/hotels', { params: filters });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể lấy danh sách khách sạn!');
    }
  },
  
  // Lấy thông tin chi tiết khách sạn
  getHotelById: async (hotelId) => {
    try {
      const response = await api.get(`/hotels/${hotelId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể lấy thông tin khách sạn!');
    }
  },
  
  // Tạo khách sạn mới (admin/staff)
  createHotel: async (hotelData) => {
    try {
      const response = await api.post('/hotels', hotelData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể tạo khách sạn mới!');
    }
  },
  
  // Cập nhật thông tin khách sạn (admin/staff)
  updateHotel: async (hotelId, hotelData) => {
    try {
      const response = await api.put(`/hotels/${hotelId}`, hotelData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể cập nhật khách sạn!');
    }
  },
  
  // Xóa khách sạn (admin)
  deleteHotel: async (hotelId) => {
    try {
      const response = await api.delete(`/hotels/${hotelId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể xóa khách sạn!');
    }
  },
};

// API Room
export const roomAPI = {
  // Lấy tất cả phòng
  getAllRooms: async (params = {}) => {
    try {
      const response = await api.get('/rooms', { params });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể lấy danh sách phòng!');
    }
  },
  
  // Lấy tất cả phòng của một khách sạn
  getRoomsByHotel: async (hotelId, params = {}) => {
    try {
      const response = await api.get(`/rooms/hotel/${hotelId}`, { params });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể lấy danh sách phòng!');
    }
  },
  
  // Lấy thông tin chi tiết phòng
  getRoomById: async (roomId) => {
    try {
      const response = await api.get(`/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể lấy thông tin phòng!');
    }
  },
  
  // Tạo phòng mới (admin/staff)
  createRoom: async (roomData) => {
    try {
      const response = await api.post('/rooms', roomData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể tạo phòng mới!');
    }
  },
  
  // Cập nhật thông tin phòng (admin/staff)
  updateRoom: async (roomId, roomData) => {
    try {
      const response = await api.put(`/rooms/${roomId}`, roomData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể cập nhật phòng!');
    }
  },
  
  // Cập nhật trạng thái phòng (admin/staff)
  updateRoomStatus: async (roomId, status) => {
    try {
      const response = await api.put(`/rooms/${roomId}/status`, { status });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể cập nhật trạng thái phòng!');
    }
  },
  
  // Xóa phòng (admin/staff)
  deleteRoom: async (roomId) => {
    try {
      const response = await api.delete(`/rooms/${roomId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể xóa phòng!');
    }
  },
};

// API Booking
export const bookingAPI = {
  // Lấy tất cả đặt phòng (admin)
  getAllBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings', { params });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể lấy danh sách đặt phòng!');
    }
  },
  
  // Tạo đặt phòng mới
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể tạo đơn đặt phòng!');
    }
  },
  
  // Lấy tất cả đặt phòng của người dùng
  getUserBookings: async () => {
    try {
      const response = await api.get('/bookings/my-bookings');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể lấy danh sách đặt phòng!');
    }
  },
  
  // Lấy thông tin chi tiết đặt phòng
  getBookingById: async (bookingId) => {
    try {
      const response = await api.get(`/bookings/${bookingId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể lấy thông tin đặt phòng!');
    }
  },
  
  // Hủy đặt phòng
  cancelBooking: async (bookingId, reason) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/cancel`, { cancellationReason: reason });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể hủy đặt phòng!');
    }
  },
  
  // Cập nhật trạng thái đặt phòng (admin/staff)
  updateBookingStatus: async (bookingId, statusData) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/status`, statusData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể cập nhật trạng thái đặt phòng!');
    }
  },
  
  // Cập nhật trạng thái thanh toán (admin/staff)
  updatePaymentStatus: async (bookingId, paymentStatus) => {
    try {
      const response = await api.put(`/bookings/${bookingId}/payment`, { paymentStatus });
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể cập nhật trạng thái thanh toán!');
    }
  },
};

// API User
export const userAPI = {
  
  // Lấy tất cả người dùng (admin only)
  getAllUsers: async () => {
    try {
      const response = await api.get('/users');
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể lấy danh sách người dùng!');
    }
  },
  
  // Lấy thông tin chi tiết người dùng (admin only)
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể lấy thông tin người dùng!');
    }
  },
  
  // Tạo người dùng mới (admin only)
  createUser: async (userData) => {
    try {
      const response = await api.post('/users', userData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể tạo người dùng mới!');
    }
  },
  
  // Cập nhật thông tin người dùng (admin only)
  updateUser: async (userId, userData) => {
    try {
      const response = await api.put(`/users/${userId}`, userData);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể cập nhật thông tin người dùng!');
    }
  },
  
  // Xóa người dùng (admin only)
  deleteUser: async (userId) => {
    try {
      const response = await api.delete(`/users/${userId}`);
      return response.data;
    } catch (error) {
      handleApiError(error, 'Không thể xóa người dùng!');
    }
  },
};

// Export API
export default {
  auth: authAPI,
  hotel: hotelAPI,
  room: roomAPI,
  booking: bookingAPI,
  user: userAPI,
}; 