// Auth API 
import authAPI from './auth/auth';

// Guest APIs
import userAPI from './guest/profile';
import userHotelAPI from './guest/hotel';
import userRoomAPI from './guest/room';
import userBookingAPI from './guest/booking';
import reviewAPI from './guest/review';
import paymentAPI from './guest/payment';
import guestWishlistAPI from './guest/wishlist';
import guestAddonAPI from './guest/addon';

// Owner APIs
import ownerHotelAPI from './owner/hotel';
import ownerRoomAPI from './owner/room';
import ownerEquipmentAPI from './owner/equipment';
import ownerBookingAPI from './owner/booking';
import ownerReviewAPI from './owner/review';
import notificationAPI from './shared/notification';
import ownerProfileAPI from './owner/profile';
import ownerAddonAPI from './owner/addon';

// Staff APIs
import staffRoomAPI from './staff/room';
import staffBookingAPI from './staff/booking';
import staffEquipmentAPI from './staff/equipment';
import staffHotelAPI from './staff/hotel';
import staffReviewAPI from './staff/review';
import staffDashboardAPI from './staff/dashboard';
import staffProfileAPI from './staff/profile';
import staffAddonAPI from './staff/addon';

// Admin APIs
import adminUserAPI from './admin/user';
import adminHotelAPI from './admin/hotel';
import adminRoomAPI from './admin/room';
import adminBookingAPI from './admin/booking';
import adminProfileAPI from './admin/profile';
import adminContactAPI from './admin/contact';
import adminCancelAbuseAPI from './admin/cancelAbuse';

// Export API
export default {
  auth: authAPI,
  user: userAPI,
  userHotel: userHotelAPI,
  userRoom: userRoomAPI,
  userBooking: userBookingAPI,
  review: reviewAPI,
  payment: paymentAPI,
  guestWishlist: guestWishlistAPI,
  guestAddon: guestAddonAPI,

  ownerHotel: ownerHotelAPI,
  ownerRoom: ownerRoomAPI,
  ownerEquipment: ownerEquipmentAPI,
  ownerBooking: ownerBookingAPI,
  ownerReview: ownerReviewAPI,
  ownerProfile: ownerProfileAPI,
  ownerAddon: ownerAddonAPI,
  
  staffRoom: staffRoomAPI,
  staffBooking: staffBookingAPI,
  staffEquipment: staffEquipmentAPI,
  staffHotel: staffHotelAPI,
  staffReview: staffReviewAPI,
  staffDashboard: staffDashboardAPI,
  staffProfile: staffProfileAPI,
  staffAddon: staffAddonAPI,
  notification: notificationAPI,
  
  adminUser: adminUserAPI,
  adminHotel: adminHotelAPI,
  adminRoom: adminRoomAPI,
  adminBooking: adminBookingAPI,
  adminProfile: adminProfileAPI,
  adminContact: adminContactAPI,
  adminCancelAbuse: adminCancelAbuseAPI,
}; 