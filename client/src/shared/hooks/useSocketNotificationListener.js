import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  connectSocket,
  disconnectSocketIfIdle,
  subscribeSocketNotifications,
} from '../socket/socketClient';

/**
 * Đăng ký lắng nghe `new_notification` trên socket dùng chung.
 * @param {((notification: object) => void)|null|undefined} callback
 * @param {{ enabled?: boolean, types?: Set<string>|null }} [options]
 */
export function useSocketNotificationListener(callback, options = {}) {
  const { enabled = true, types = null } = options;
  const { user, isAuthenticated } = useAuth();
  const callbackRef = useRef(callback);
  const typesRef = useRef(types);

  useEffect(() => {
    callbackRef.current = callback;
    typesRef.current = types;
  }, [callback, types]);

  useEffect(() => {
    const userId = user?._id || user?.id;
    const isActive = enabled && isAuthenticated && userId && typeof callbackRef.current === 'function';

    if (!isActive) {
      return undefined;
    }

    connectSocket(userId);

    const handler = (notification) => {
      const filter = typesRef.current;
      if (filter && !filter.has(notification?.type)) {
        return;
      }
      callbackRef.current?.(notification);
    };

    const unsubscribe = subscribeSocketNotifications(handler);

    return () => {
      unsubscribe();
      disconnectSocketIfIdle();
    };
  }, [user, isAuthenticated, enabled]);
}
