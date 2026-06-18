import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaCalendarAlt,
  FaExclamationTriangle,
  FaUser,
  FaBell,
  FaCheck,
  FaTimes,
  FaBan,
  FaClock,
} from 'react-icons/fa';
import StaffLayout from '../components/StaffLayout';
import api from '@/apis';
import { useAuth, useSocket } from '@/shared/hooks';
import { formatDateTime } from '@/shared/utils';
import { getNotificationPath } from '@/features/notifications/config/notificationConfig';
import {
  isNotificationReadByUser,
  markReadInList,
  markAllReadInList,
} from '@/features/notifications/utils/notificationRead';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import '@/features/owner/notifications/Notifications.scss';

const StaffNotificationsPage = () => {
  const { user } = useAuth();
  const userId = user?._id || user?.id;
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [unreadCount, setUnreadCount] = useState(0);
  const limit = PAGE_SIZE.NOTIFICATIONS;

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ngày trước`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_booking':
      case 'checkin_today':
      case 'checkout_today':
        return <FaCalendarAlt />;
      case 'booking_cancelled':
        return <FaBan />;
      case 'no_show':
        return <FaClock />;
      case 'new_review':
        return <FaUser />;
      case 'negative_review':
        return <FaExclamationTriangle style={{ color: '#dc3545' }} />;
      case 'hotel_status_changed':
        return <FaExclamationTriangle style={{ color: '#e67e22' }} />;
      default:
        return <FaBell />;
    }
  };

  const fetchNotifications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await api.notification.staff.getNotifications(pageNum, limit);
      setNotifications(response.notifications || []);
      setUnreadCount(response.unreadCount || 0);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotal(response.pagination?.total || response.notifications?.length || 0);
      setPage(pageNum);
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.notification.staff.markAsRead(notificationId);
      setNotifications((prev) => markReadInList(prev, notificationId, userId));
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.notification.staff.markAllAsRead();
      setNotifications((prev) => markAllReadInList(prev, userId));
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả thông báo:', error);
    }
  };

  const handleRealtimeNotification = (notification) => {
    setNotifications((prev) => {
      const exists = prev.some((n) => n._id === notification._id);
      if (exists) return prev;
      if (page === 1) return [notification, ...prev].slice(0, limit);
      return prev;
    });
  };

  const handleUnreadCountUpdate = (count) => {
    setUnreadCount(count);
  };

  useSocket(handleRealtimeNotification, handleUnreadCountUpdate);

  const handleNotificationClick = (notification) => {
    if (!isNotificationReadByUser(notification, userId)) {
      handleMarkAsRead(notification._id);
    }

    const path = getNotificationPath(notification, 'staff');
    if (path) {
      navigate(path);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <StaffLayout>
      <div className="notifications-page">
        <div className="notifications-header">
          <button
            className="mark-all-read-btn"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <FaCheck /> Đánh dấu tất cả là đã đọc
          </button>
        </div>

        <div className="notifications-list">
          {loading && notifications.length === 0 ? (
            <div className="notifications-empty">Đang tải...</div>
          ) : notifications.length === 0 ? (
            <div className="notifications-empty">Không có thông báo nào</div>
          ) : (
            notifications.map((notification) => {
              const read = isNotificationReadByUser(notification, userId);
              return (
              <div
                key={notification._id}
                className={`notification-item ${!read ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title-row">
                    <div className="notification-title">{notification.title}</div>
                    {!read && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMarkAsRead(notification._id);
                        }}
                        title="Đánh dấu là đã đọc"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">
                    {formatTimeAgo(notification.createdAt)} •{' '}
                    {formatDateTime(notification.createdAt)}
                  </div>
                </div>
              </div>
            );
            })
          )}
        </div>

        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={limit}
          onPageChange={setPage}
          variant="center"
          className="notifications-pagination"
        />
      </div>
    </StaffLayout>
  );
};

export default StaffNotificationsPage;
