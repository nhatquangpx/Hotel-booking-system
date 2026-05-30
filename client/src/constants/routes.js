/**
 * Route path constants — đồng bộ với client/src/routes/index.jsx
 *
 * Route tĩnh: chuỗi (ROUTES.HOME).
 * Route động: hàm build URL + `.pattern` cho <Route path={...} />.
 *   Ví dụ: navigate(ROUTES.profile(userId)) — Route path={ROUTES.profile.pattern}
 */

function defineRoute(pattern) {
  const fn = (...values) => {
    let i = 0;
    return pattern.replace(/:([A-Za-z]+)/g, () => {
      const v = values[i++];
      return v != null && v !== '' ? encodeURIComponent(String(v)) : '';
    });
  };
  fn.pattern = pattern;
  return fn;
}

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
  hotelDetail: defineRoute('/hotels/:id'),
  BOOKING_NEW: '/booking/new',
  MY_BOOKINGS: '/my-bookings',
  WISHLIST: '/wishlist',
  NOTIFICATIONS: '/notifications',
  PAYMENT_VNPAY_RETURN: '/payment/vnpay-return',
  profile: defineRoute('/profile/:id'),
  profileEdit: defineRoute('/profile/:id/edit'),
  profileChangePassword: defineRoute('/profile/:id/changepassword'),

  // Admin
  ADMIN_HOME: '/admin',
  ADMIN_USERS: '/admin/users',
  adminUserDetail: defineRoute('/admin/users/:id'),
  ADMIN_HOTELS: '/admin/hotels',
  adminHotelDetail: defineRoute('/admin/hotels/:id'),
  adminRoomCreate: defineRoute('/admin/hotels/:hotelId/rooms/create'),
  adminRoomDetail: defineRoute('/admin/rooms/:id'),
  adminRoomEdit: defineRoute('/admin/rooms/:id/edit'),
  ADMIN_BOOKINGS: '/admin/bookings',
  adminBookingDetail: defineRoute('/admin/bookings/:id'),
  ADMIN_CONTACT_MESSAGES: '/admin/contact-messages',
  ADMIN_PROFILE: '/admin/profile',
  ADMIN_PROFILE_EDIT: '/admin/profile/edit',
  ADMIN_PROFILE_CHANGE_PASSWORD: '/admin/profile/changepassword',
  ADMIN_PROFILE_TWO_FACTOR: '/admin/profile/two-factor',

  // Owner
  OWNER_HOME: '/owner',
  OWNER_ROOMS: '/owner/rooms',
  OWNER_PRICING: '/owner/pricing',
  OWNER_SALE: '/owner/sale',
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

export const profilePathForRole = (role, userId) => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN_PROFILE;
    case 'owner':
      return ROUTES.OWNER_PROFILE;
    case 'staff':
      return ROUTES.STAFF_PROFILE;
    default:
      return ROUTES.profile(userId);
  }
};

export const profileChangePasswordPathForRole = (role, userId) => {
  switch (role) {
    case 'admin':
      return ROUTES.ADMIN_PROFILE_CHANGE_PASSWORD;
    case 'owner':
      return ROUTES.OWNER_PROFILE_CHANGE_PASSWORD;
    case 'staff':
      return ROUTES.STAFF_PROFILE_CHANGE_PASSWORD;
    default:
      return ROUTES.profileChangePassword(userId);
  }
};
