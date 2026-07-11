const STORAGE_PREFIX = 'cccd-reminder-dismissed:';

export function cccdReminderStorageKey(userId) {
  return `${STORAGE_PREFIX}${userId || 'unknown'}`;
}

export function isCccdReminderDismissed(userId) {
  if (typeof sessionStorage === 'undefined' || !userId) return false;
  return sessionStorage.getItem(cccdReminderStorageKey(userId)) === '1';
}

export function dismissCccdReminder(userId) {
  if (typeof sessionStorage === 'undefined' || !userId) return;
  sessionStorage.setItem(cccdReminderStorageKey(userId), '1');
}

/** Xóa cờ tắt nhắc CCCD khi đăng xuất (hết phiên). */
export function clearCccdReminderDismissals() {
  if (typeof sessionStorage === 'undefined') return;
  const keys = [];
  for (let i = 0; i < sessionStorage.length; i += 1) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(STORAGE_PREFIX)) keys.push(key);
  }
  keys.forEach((key) => sessionStorage.removeItem(key));
}
