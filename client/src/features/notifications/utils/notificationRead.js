/** Trạng thái đọc — chỉ dựa readBy. */

export function isNotificationReadByUser(notification, userId) {
  if (!notification || !userId) return false;
  const uid = String(userId);
  return (notification.readBy || []).some((id) => String(id) === uid);
}

/** Cập nhật local sau khi đánh dấu đã đọc. */
export function withUserMarkedRead(notification, userId) {
  if (!notification || !userId) return notification;
  const uid = String(userId);
  const readBy = [...(notification.readBy || [])];
  if (!readBy.some((id) => String(id) === uid)) {
    readBy.push(userId);
  }
  return { ...notification, readBy };
}

export function markReadInList(notifications, notificationId, userId) {
  return notifications.map((n) =>
    n._id === notificationId ? withUserMarkedRead(n, userId) : n
  );
}

export function markAllReadInList(notifications, userId) {
  return notifications.map((n) => withUserMarkedRead(n, userId));
}
