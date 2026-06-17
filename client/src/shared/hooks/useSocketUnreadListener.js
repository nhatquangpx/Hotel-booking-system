import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  connectSocket,
  disconnectSocketIfIdle,
  subscribeSocketUnreadCount,
} from '../socket/socketClient';

/**
 * Đăng ký lắng nghe `unread_count_update` trên socket dùng chung.
 * @param {((count: number) => void)|null|undefined} callback
 * @param {boolean} [enabled=true]
 */
export function useSocketUnreadListener(callback, enabled = true) {
  const { user, isAuthenticated } = useAuth();
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    const isActive = enabled && isAuthenticated && userId && typeof callbackRef.current === 'function';

    if (!isActive) {
      return undefined;
    }

    connectSocket(userId);

    const handler = (count) => {
      callbackRef.current?.(count);
    };

    const unsubscribe = subscribeSocketUnreadCount(handler);

    return () => {
      unsubscribe();
      disconnectSocketIfIdle();
    };
  }, [user, isAuthenticated, enabled]);
}
