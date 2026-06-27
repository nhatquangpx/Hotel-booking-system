import { useEffect, useState } from 'react';
import {
  formatPendingHoldCountdown,
  getPendingHoldRemainingMs,
  isPendingHoldExpired,
} from '@/shared/utils';

/**
 * Đếm ngược đến pendingExpiresAt; gọi onExpired khi hết hạn.
 */
export function usePendingHoldCountdown(pendingExpiresAt, { enabled = true, onExpired } = {}) {
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    const ms = getPendingHoldRemainingMs(pendingExpiresAt);
    return ms === null ? null : Math.ceil(ms / 1000);
  });
  const [expired, setExpired] = useState(() =>
    pendingExpiresAt ? isPendingHoldExpired(pendingExpiresAt) : false
  );

  useEffect(() => {
    if (!pendingExpiresAt) {
      setRemainingSeconds(null);
      setExpired(false);
      return undefined;
    }

    if (!enabled) {
      return undefined;
    }

    let expiredNotified = false;

    const tick = () => {
      const ms = getPendingHoldRemainingMs(pendingExpiresAt);
      if (ms === null) {
        setRemainingSeconds(null);
        setExpired(false);
        return;
      }
      if (ms <= 0) {
        setRemainingSeconds(0);
        setExpired(true);
        if (!expiredNotified) {
          expiredNotified = true;
          onExpired?.();
        }
        return;
      }
      setRemainingSeconds(Math.ceil(ms / 1000));
      setExpired(false);
    };

    tick();
    const intervalId = setInterval(tick, 1000);
    return () => clearInterval(intervalId);
  }, [pendingExpiresAt, enabled, onExpired]);

  return {
    remainingSeconds,
    expired,
    formatted:
      remainingSeconds === null ? null : formatPendingHoldCountdown(remainingSeconds),
  };
}
