// Auth API 
import authAPI from './auth/auth';

// Guest APIs
import userAPI from './guest/profile';
import hotelAPI from './guest/hotel';
import roomAPI from './guest/room';
import bookingAPI from './guest/booking';

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
  hotel: hotelAPI,
  room: roomAPI,
  booking: bookingAPI,
  ownerHotel: ownerHotelAPI,
  ownerRoom: ownerRoomAPI,
  ownerBooking: ownerBookingAPI,
  adminUser: adminUserAPI,
  adminHotel: adminHotelAPI,
  adminRoom: adminRoomAPI,
  adminBooking: adminBookingAPI
}; 