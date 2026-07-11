/**
 * Route path constants — đồng bộ với client/src/routes/index.jsx
 *
 * Route tĩnh: ROUTES.HOME, ROUTES.HOTELS, ...
 * Route có tham số: pattern trong ROUTES (vd. HOTEL_DETAIL) + hotelDetailPath(id) để navigate/Link.
 */

/** Build URL chi tiết khách sạn — dùng với <Route path={ROUTES.HOTEL_DETAIL} /> */
export const hotelDetailPath = (id) =>
  `/hotels/${encodeURIComponent(String(id))}`;

export const ROUTES = {
  // Public
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',

  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgotpassword',

  // Guest
  HOTELS: '/hotels',
  HOTEL_DETAIL: '/hotels/:id',
  BOOKING_NEW: '/booking/new',
  MY_BOOKINGS: '/my-bookings',
  WISHLIST: '/wishlist',
  NOTIFICATIONS: '/notifications',
  PAYMENT_VNPAY_RETURN: '/payment/vnpay-return',
  PROFILE: '/profile',
  PROFILE_EDIT: '/profile/edit',
  PROFILE_CHANGE_PASSWORD: '/profile/changepassword',

  // Admin
  ADMIN_HOME: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_HOTELS: '/admin/hotels',
  ADMIN_BOOKINGS: '/admin/bookings',
  ADMIN_CONTACT_MESSAGES: '/admin/contact-messages',
  ADMIN_NOTIFICATIONS: '/admin/notifications',
  ADMIN_PROFILE: '/admin/profile',
  ADMIN_PROFILE_EDIT: '/admin/profile/edit',
  ADMIN_PROFILE_CHANGE_PASSWORD: '/admin/profile/changepassword',
  ADMIN_PROFILE_TWO_FACTOR: '/admin/profile/two-factor',

  // Owner
  OWNER_HOME: '/owner',
  OWNER_ROOMS: '/owner/rooms',
  OWNER_PRICING: '/owner/pricing',
  OWNER_SALE: '/owner/sale',
  OWNER_ADDON_SERVICES: '/owner/addon-services',
  OWNER_BOOKINGS: '/owner/bookings',
  OWNER_EQUIPMENT: '/owner/equipment',
  OWNER_REVIEWS: '/owner/reviews',
  OWNER_NOTIFICATIONS: '/owner/notifications',
  OWNER_PROFILE: '/owner/profile',
  OWNER_PROFILE_EDIT: '/owner/profile/edit',
  OWNER_PROFILE_CHANGE_PASSWORD: '/owner/profile/changepassword',
  OWNER_PROFILE_TWO_FACTOR: '/owner/profile/two-factor',

  // Staff
  STAFF_HOME: '/staff',
  STAFF_ROOMS: '/staff/rooms',
  STAFF_BOOKINGS: '/staff/bookings',
  STAFF_ADDON_SERVICES: '/staff/addon-services',
  STAFF_EQUIPMENT: '/staff/equipment',
  STAFF_REVIEWS: '/staff/reviews',
  STAFF_NOTIFICATIONS: '/staff/notifications',
  STAFF_PROFILE: '/staff/profile',
  STAFF_PROFILE_EDIT: '/staff/profile/edit',
  STAFF_PROFILE_CHANGE_PASSWORD: '/staff/profile/changepassword',
};

/** Trang mặc định sau đăng nhập / nút "về khu vực của bạn" theo role */
export const ROLE_HOME_ROUTES = {
  guest: ROUTES.HOME,
  admin: ROUTES.ADMIN_HOME,
  owner: ROUTES.OWNER_HOME,
  staff: ROUTES.STAFF_HOME,
};

export const profilePathForRole = (role) => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN_PROFILE;
    case 'owner':
      return ROUTES.OWNER_PROFILE;
    case 'staff':
      return ROUTES.STAFF_PROFILE;
    default:
      return ROUTES.PROFILE;
  }
};

export const profileChangePasswordPathForRole = (role) => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN_PROFILE_CHANGE_PASSWORD;
    case 'owner':
      return ROUTES.OWNER_PROFILE_CHANGE_PASSWORD;
    case 'staff':
      return ROUTES.STAFF_PROFILE_CHANGE_PASSWORD;
    default:
      return ROUTES.PROFILE_CHANGE_PASSWORD;
  }
};
