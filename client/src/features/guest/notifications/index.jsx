import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaDollarSign, FaBell, FaCheck, FaTimes, FaBan } from 'react-icons/fa';
import { GuestLayout } from '../components/layout';
import api from '@/apis';
import { useAuth, useSocket } from '@/shared/hooks';
import { getNotificationPath } from '@/features/notifications/config/notificationConfig';
import {
  isNotificationReadByUser,
  markReadInList,
  markAllReadInList,
} from '@/features/notifications/utils/notificationRead';
import { formatDateTime } from '@/shared/utils';
import Pagination from '@/shared/components/Pagination/Pagination';
import { PAGE_SIZE } from '@/constants/pagination';
import './Notifications.scss';

const GuestNotificationsPage = () => {
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

  // Format thời gian
  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) {
      return 'Vừa xong';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes} phút trước`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours} giờ trước`;
    } else {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days} ngày trước`;
    }
  };

  // Lấy icon theo loại thông báo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'booking_confirmed':
      case 'booking_reopened':
        return <FaCalendarAlt />;
      case 'refund_processed':
        return <FaDollarSign />;
      case 'booking_cancelled':
      case 'payment_rejected':
      case 'qr_proof_resubmit':
        return <FaBan />;
      default:
        return <FaBell />;
    }
  };

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1) => {
    setLoading(true);
    try {
      const response = await api.notification.guest.getNotifications(pageNum, limit);
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

  // Mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.notification.guest.markAsRead(notificationId);
      setNotifications((prev) => markReadInList(prev, notificationId, userId));
      // Unread count sẽ được update từ socket
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.notification.guest.markAllAsRead();
      setNotifications((prev) => markAllReadInList(prev, userId));
      // Unread count sẽ được update từ socket
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả thông báo:', error);
    }
  };

  // Handle realtime notification
  const handleRealtimeNotification = (notification) => {
    setNotifications(prev => {
      const exists = prev.some(n => n._id === notification._id);
      if (exists) return prev;
      if (page === 1) return [notification, ...prev].slice(0, limit);
      return prev;
    });
  };

  // Handle realtime unread count update
  const handleUnreadCountUpdate = (count) => {
    setUnreadCount(count);
  };

  // Setup Socket.io connection for realtime notifications
  useSocket(handleRealtimeNotification, handleUnreadCountUpdate);

  // Handle notification click
  const handleNotificationClick = (notification) => {
    if (!isNotificationReadByUser(notification, userId)) {
      handleMarkAsRead(notification._id);
    }
    
    // Navigate based on notification type
    const path = getNotificationPath(notification, 'guest');
    if (path) {
      navigate(path);
    }
  };

  useEffect(() => {
    fetchNotifications(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  return (
    <GuestLayout>
      <div className="notifications-page guest-notifications">
        <div className="notifications-container">
          <div className="notifications-header">
            <h1>Thông báo</h1>
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
                      {formatTimeAgo(notification.createdAt)} • {formatDateTime(notification.createdAt)}
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
      </div>
    </GuestLayout>
  );
};

export default GuestNotificationsPage;
