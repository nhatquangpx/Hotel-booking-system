/**
 * Notification Configuration
 * Role-based configuration for notification system
 */

export const notificationConfig = {
  owner: {
    apiPrefix: '/owner',
    routes: {
      list: '/owner/notifications',
      booking: (id) => `/owner/bookings?bookingId=${id}`,
      review: '/owner/reviews'
    },
    supportedTypes: [
      'new_booking',
      'payment_successful',
      'booking_cancelled',
      'no_show',
      'checkin_today',
      'checkout_today',
      'new_review',
      'negative_review',
      'room_availability'
    ]
  },
  admin: {
    apiPrefix: '/admin',
    routes: {
      list: '/admin/notifications',
      booking: (id) => `/admin/bookings/${id}`,
      user: (id) => `/admin/users/${id}`,
      hotel: (id) => `/admin/hotels/${id}`
    },
    supportedTypes: [
      'new_booking',
      'new_user',
      'new_hotel',
      'payment_successful',
      'booking_cancelled',
      'new_review',
      'negative_review'
    ]
  },
  staff: {
    apiPrefix: '/staff',
    routes: {
      list: '/staff/notifications',
      booking: (id) => `/staff/bookings?bookingId=${id}`,
      review: '/staff/reviews',
      rooms: '/staff/rooms',
      equipment: '/staff/equipment'
    },
    supportedTypes: [
      'new_booking',
      'payment_successful',
      'booking_cancelled',
      'no_show',
      'checkin_today',
      'checkout_today',
      'new_review',
      'negative_review'
    ]
  },
  guest: {
    apiPrefix: '/guest',
    routes: {
      list: '/notifications',
      booking: (id) => `/my-bookings?bookingId=${id}`,
      profile: '/profile'
    },
    supportedTypes: [
      'booking_confirmed',
      'booking_cancelled',
      'payment_successful',
      'payment_reminder',
      'refund_processed',
      'upcoming_trip_reminder',
      'checkin_instructions',
      'review_request',
      'review_reply',
      'promotion',
      'security_alert'
    ]
  }
};

/**
 * Get navigation path based on notification type and role
 */
export const getNotificationPath = (notification, role) => {
  const config = notificationConfig[role];
  if (!config || !notification.relatedId) return null;

  switch (notification.type) {
    case 'new_booking':
    case 'payment_successful':
    case 'booking_cancelled':
    case 'no_show':
    case 'checkin_today':
    case 'checkout_today':
    case 'booking_confirmed':
    case 'payment_reminder':
    case 'refund_processed':
    case 'upcoming_trip_reminder':
    case 'checkin_instructions':
    case 'review_request':
      return config.routes.booking(notification.relatedId);
    
    case 'new_review':
    case 'negative_review':
    case 'review_reply':
      if (config.routes.review) {
        return config.routes.review;
      }
      return config.routes.list;
    
    case 'new_user':
      return config.routes.user ? config.routes.user(notification.relatedId) : config.routes.list;
    
    case 'new_hotel':
      return config.routes.hotel ? config.routes.hotel(notification.relatedId) : config.routes.list;
    
    case 'promotion':
    case 'security_alert':
    default:
      return config.routes.list;
  }
};

