// Route constants for the application
export const ROUTES = {
  // Public routes
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  
  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgotpassword',
  
  // Guest routes
  HOTELS: '/hotels',
  HOTEL_DETAIL: (id) => `/hotels/${id}`,
  BOOKING_NEW: '/booking/new',
  MY_BOOKINGS: '/my-bookings',
  PROFILE: (id) => `/profile/${id}`,
  PROFILE_EDIT: (id) => `/profile/${id}/edit`,
  CHANGE_PASSWORD: (id) => `/profile/${id}/changepassword`,
  
  // Admin routes
  ADMIN_HOME: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_USER_DETAIL: (id) => `/admin/users/${id}`,
  ADMIN_HOTELS: '/admin/hotels',
  ADMIN_HOTEL_DETAIL: (id) => `/admin/hotels/${id}`,
  ADMIN_ROOM_CREATE: (hotelId) => `/admin/hotels/${hotelId}/rooms/create`,
  ADMIN_ROOM_DETAIL: (id) => `/admin/rooms/${id}`,
  ADMIN_ROOM_EDIT: (id) => `/admin/rooms/${id}/edit`,
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_BOOKING_DETAIL: (id) => `/admin/bookings/${id}`,
  
  // Owner routes (future)
  OWNER_DASHBOARD: '/owner',
  OWNER_HOTELS: '/owner/hotels',
  OWNER_BOOKINGS: '/owner/bookings',
  OWNER_REVENUE: '/owner/revenue',
  
  // Payment routes (future)
  PAYMENT_VNPAY: '/payment/vnpay',
  PAYMENT_CALLBACK: '/payment/callback',
  INVOICES: '/invoices',
  
  // Review routes (future)
  REVIEWS: '/reviews',
  CREATE_REVIEW: (hotelId) => `/hotels/${hotelId}/review`,
};
