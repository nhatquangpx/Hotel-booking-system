import { useSocketNotificationListener } from './useSocketNotificationListener';
import { useSocketUnreadListener } from './useSocketUnreadListener';

/**
 * Lắng nghe thông báo realtime + cập nhật số chưa đọc (NotificationBell, trang thông báo).
 * Dùng socket singleton — nhiều hook có thể đăng ký song song.
 */
export const useSocket = (onNotification, onUnreadCountUpdate) => {
  useSocketNotificationListener(onNotification, {
    enabled: typeof onNotification === 'function',
  });
  useSocketUnreadListener(onUnreadCountUpdate, typeof onUnreadCountUpdate === 'function');
};
