// Auth API 
import authAPI from './auth/auth';

// Guest APIs
import userAPI from './guest/profile';
import userHotelAPI from './guest/hotel';
import userRoomAPI from './guest/room';
import userBookingAPI from './guest/booking';

// Owner APIs
import ownerHotelAPI from './owner/hotel';
import ownerRoomAPI from './owner/room';
import ownerBookingAPI from './owner/booking';

// Admin APIs
import adminUserAPI from './admin/user';
import adminHotelAPI from './admin/hotel';
import adminRoomAPI from './admin/room';
import adminBookingAPI from './admin/booking';

// Export API
export default {
  auth: authAPI,
  user: userAPI,
  userHotel: userHotelAPI,
  userRoom: userRoomAPI,
  userBooking: userBookingAPI,
  ownerHotel: ownerHotelAPI,
  ownerRoom: ownerRoomAPI,
  ownerBooking: ownerBookingAPI,
  adminUser: adminUserAPI,
  adminHotel: adminHotelAPI,
  adminRoom: adminRoomAPI,
  adminBooking: adminBookingAPI
}; 