import { useCallback } from 'react';
import { useSocketNotificationListener } from '@/shared/hooks/useSocketNotificationListener';
import { HOTEL_BOOKING_NOTIFICATION_TYPES } from '@/shared/socket';

/**
 * Refetch lịch đặt phòng khi có sự kiện booking realtime qua socket khách sạn.
 */
export function useStaffBookingCalendarSocket(onRefresh, enabled = true) {
  const handleNotification = useCallback(() => {
    onRefresh();
  }, [onRefresh]);

  useSocketNotificationListener(handleNotification, {
    enabled: enabled && typeof onRefresh === 'function',
    types: HOTEL_BOOKING_NOTIFICATION_TYPES,
  });
}
