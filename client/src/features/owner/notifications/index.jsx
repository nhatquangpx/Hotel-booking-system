import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCalendarAlt, FaDollarSign, FaExclamationTriangle, FaUser, FaBell, FaCheck, FaTimes, FaBan, FaClock } from 'react-icons/fa';
import OwnerLayout from '../components/OwnerLayout';
import api from '@/apis';
import { useSocket } from '@/shared/hooks';
import './Notifications.scss';

const OwnerNotificationsPage = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const limit = 20;

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

  const formatDateTime = (date) => {
    return new Date(date).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Lấy icon theo loại thông báo
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_booking':
      case 'checkin_today':
      case 'checkout_today':
        return <FaCalendarAlt />;
      case 'payment_successful':
        return <FaDollarSign />;
      case 'booking_cancelled':
        return <FaBan />;
      case 'no_show':
        return <FaClock />;
      case 'room_availability':
        return <FaExclamationTriangle />;
      case 'new_review':
        return <FaUser />;
      case 'negative_review':
        return <FaExclamationTriangle style={{ color: '#dc3545' }} />;
      default:
        return <FaBell />;
    }
  };

  // Fetch notifications
  const fetchNotifications = async (pageNum = 1, append = false) => {
    setLoading(true);
    try {
      const response = await api.notification.owner.getNotifications(pageNum, limit);
      if (append) {
        setNotifications(prev => [...prev, ...response.notifications]);
      } else {
        setNotifications(response.notifications);
      }
      setUnreadCount(response.unreadCount);
      setHasMore(response.pagination.page < response.pagination.totalPages);
      setPage(pageNum);
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load more
  const handleLoadMore = () => {
    if (!hasMore || loading) return;
    fetchNotifications(page + 1, true);
  };

  // Mark as read
  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.notification.owner.markAsRead(notificationId);
      setNotifications(prev =>
        prev.map(notif =>
          notif._id === notificationId
            ? { ...notif, isRead: true, readAt: new Date() }
            : notif
        )
      );
      // Unread count sẽ được update từ socket
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo:', error);
    }
  };

  // Mark all as read
  const handleMarkAllAsRead = async () => {
    try {
      await api.notification.owner.markAllAsRead();
      setNotifications(prev =>
        prev.map(notif => ({ ...notif, isRead: true, readAt: new Date() }))
      );
      // Unread count sẽ được update từ socket
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả thông báo:', error);
    }
  };

  // Handle realtime notification
  const handleRealtimeNotification = (notification) => {
    // Thêm notification mới vào đầu danh sách
    setNotifications(prev => {
      // Kiểm tra xem notification đã tồn tại chưa (tránh duplicate)
      const exists = prev.some(n => n._id === notification._id);
      if (exists) return prev;
      return [notification, ...prev];
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
    if (!notification.isRead) {
      handleMarkAsRead(notification._id);
    }
    
    if (notification.relatedId) {
      switch (notification.type) {
        case 'new_booking':
        case 'payment_successful':
        case 'booking_cancelled':
        case 'no_show':
        case 'checkin_today':
        case 'checkout_today':
          navigate(`/owner/bookings/${notification.relatedId}`);
          break;
        case 'new_review':
        case 'negative_review':
          navigate('/owner/reviews');
          break;
        default:
          break;
      }
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
  }, []);

  return (
    <OwnerLayout>
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
            notifications.map((notification) => (
              <div
                key={notification._id}
                className={`notification-item ${!notification.isRead ? 'unread' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title-row">
                    <div className="notification-title">{notification.title}</div>
                    {!notification.isRead && (
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
            ))
          )}
        </div>

        {hasMore && (
          <div className="notifications-footer">
            <button
              className="load-more-btn"
              onClick={handleLoadMore}
              disabled={loading}
            >
              {loading ? 'Đang tải...' : 'Tải thêm thông báo'}
            </button>
          </div>
        )}
      </div>
    </OwnerLayout>
  );
};

export default OwnerNotificationsPage;

