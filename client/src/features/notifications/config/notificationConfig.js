/**
 * Notification Configuration
 * Role-based configuration for notification system
 */

export const notificationConfig = {
  owner: {
    apiPrefix: '/owner',
    routes: {
      list: '/owner/notifications',
      booking: (id) => `/owner/bookings?filter=action&bookingId=${id}`,
      review: '/owner/reviews'
    },
    supportedTypes: [
      'new_booking',
      'booking_cancelled',
      'checkin_today',
      'checkout_today',
      'new_review',
      'negative_review',
      'hotel_status_changed'
    ]
  },
  admin: {
    apiPrefix: '/admin',
    routes: {
      list: '/admin/notifications',
      booking: (id) => `/admin/bookings?bookingId=${id}`,
      user: (id) => `/admin/users?userId=${id}`,
      hotel: (id) => `/admin/hotels?hotelId=${id}`
    },
    supportedTypes: [
      'high_value_booking',
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
      bookingAction: (id) => `/staff/bookings?filter=action&bookingId=${id}`,
      review: '/staff/reviews',
      rooms: '/staff/rooms',
      equipment: '/staff/equipment'
    },
    supportedTypes: [
      'new_booking',
      'booking_cancelled',
      'checkin_today',
      'checkout_today',
      'new_review',
      'negative_review',
      'hotel_status_changed'
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
      'payment_rejected',
      'qr_proof_resubmit',
      'refund_processed'
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
    case 'checkin_today':
    case 'checkout_today':
      if (role === 'staff' && config.routes.bookingAction) {
        return config.routes.bookingAction(notification.relatedId);
      }
      return config.routes.booking(notification.relatedId);

    case 'new_booking':
    case 'booking_cancelled':
    case 'booking_confirmed':
    case 'payment_rejected':
    case 'qr_proof_resubmit':
    case 'refund_processed':
    case 'high_value_booking':
      return config.routes.booking(notification.relatedId);

    case 'new_review':
    case 'negative_review':
      if (config.routes.review) {
        return config.routes.review;
      }
      return config.routes.list;

    case 'hotel_status_changed':
      return config.routes.list;

    default:
      return config.routes.list;
  }
};
