import React, { useState, useEffect, useRef } from 'react';
import { FaBell, FaCheck, FaCalendarAlt, FaDollarSign, FaExclamationTriangle, FaUser, FaTimes, FaBan, FaClock } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth, useSocket } from '@/shared/hooks';
import { notificationConfig, getNotificationPath } from '../config/notificationConfig';
import notificationAPI from '@/apis/shared/notification';
import {
  isNotificationReadByUser,
  markReadInList,
  markAllReadInList,
} from '../utils/notificationRead';
import './NotificationBell.scss';

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const dropdownRef = useRef(null);
  const limit = 5;

  const userId = user?._id || user?.id;
  const role = user?.role;
  const config = role ? notificationConfig[role] : null;
  const api = role ? notificationAPI[role] : null;

  const formatTimeAgo = (date) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInSeconds = Math.floor((now - notificationDate) / 1000);

    if (diffInSeconds < 60) return 'Vừa xong';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} phút trước`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} giờ trước`;
    return `${Math.floor(diffInSeconds / 86400)} ngày trước`;
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'new_booking':
      case 'booking_confirmed':
      case 'checkin_today':
      case 'checkin_reminder':
      case 'checkout_today':
      case 'checkout_reminder':
        return <FaCalendarAlt />;
      case 'payment_successful':
        return <FaDollarSign />;
      case 'payment_failed':
        return <FaExclamationTriangle style={{ color: '#dc3545' }} />;
      case 'booking_cancelled':
        return <FaBan />;
      case 'no_show':
        return <FaClock />;
      case 'room_availability':
        return <FaExclamationTriangle />;
      case 'new_review':
      case 'review_request':
        return <FaUser />;
      case 'negative_review':
        return <FaExclamationTriangle style={{ color: '#dc3545' }} />;
      default:
        return <FaBell />;
    }
  };

  const fetchNotifications = async (page = 1, append = false) => {
    if (loading || !api) return;

    setLoading(true);
    try {
      const response = await api.getNotifications(page, limit);
      if (append) {
        setNotifications((prev) => [...prev, ...response.notifications]);
      } else {
        setNotifications(response.notifications);
      }
      setUnreadCount(response.unreadCount);
      setHasMore(response.pagination.page < response.pagination.totalPages);
      setCurrentPage(page);
    } catch (error) {
      console.error('Lỗi khi tải thông báo:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    if (!api) return;
    try {
      const response = await api.getUnreadCount();
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Lỗi khi tải số lượng thông báo chưa đọc:', error);
    }
  };

  const handleLoadMore = async () => {
    if (!hasMore || loading) return;
    await fetchNotifications(currentPage + 1, true);
  };

  const handleMarkAsRead = async (notificationId, e) => {
    if (e) e.stopPropagation();
    if (!api || !userId) return;
    try {
      await api.markAsRead(notificationId);
      setNotifications((prev) => markReadInList(prev, notificationId, userId));
    } catch (error) {
      console.error('Lỗi khi đánh dấu thông báo:', error);
    }
  };

  const handleMarkAllAsRead = async (e) => {
    if (e) e.stopPropagation();
    if (!api || !userId) return;
    try {
      await api.markAllAsRead();
      setNotifications((prev) => markAllReadInList(prev, userId));
    } catch (error) {
      console.error('Lỗi khi đánh dấu tất cả thông báo:', error);
    }
  };

  const handleNotificationClick = (notification) => {
    if (!isNotificationReadByUser(notification, userId)) {
      handleMarkAsRead(notification._id, { stopPropagation: () => {} });
    }

    const path = getNotificationPath(notification, role);
    if (path) navigate(path);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && role && config) {
      fetchNotifications(1, false);
    }
  }, [isOpen, role]);

  const handleRealtimeNotification = (notification) => {
    setNotifications((prev) => {
      if (prev.some((n) => n._id === notification._id)) return prev;
      return [notification, ...prev];
    });
  };

  const handleUnreadCountUpdate = (count) => {
    setUnreadCount(count);
  };

  useSocket(handleRealtimeNotification, handleUnreadCountUpdate);

  useEffect(() => {
    if (role && config) fetchUnreadCount();
  }, [role]);

  if (!role || !config || !api) {
    return null;
  }

  return (
    <div className="notification-bell" ref={dropdownRef}>
      <button
        className="notification-bell-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Thông báo"
      >
        <FaBell />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
        )}
      </button>

      {isOpen && (
        <div className="notification-dropdown">
          <div className="notification-header">
            <h3>Thông báo</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={handleMarkAllAsRead}
                title="Đánh dấu tất cả là đã đọc"
              >
                <FaCheck /> Đánh dấu tất cả
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading && notifications.length === 0 ? (
              <div className="notification-empty">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="notification-empty">Không có thông báo nào</div>
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
                      <div className="notification-title">{notification.title}</div>
                      <div className="notification-message">{notification.message}</div>
                      <div className="notification-time">
                        {formatTimeAgo(notification.createdAt)}
                      </div>
                    </div>
                    {!read && (
                      <button
                        className="mark-read-btn"
                        onClick={(e) => handleMarkAsRead(notification._id, e)}
                        title="Đánh dấu là đã đọc"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="notification-footer">
              {hasMore && (
                <button
                  className="load-more-btn"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Đang tải...' : 'Tải thêm thông báo'}
                </button>
              )}
              <button
                className="view-all-btn"
                onClick={() => {
                  setIsOpen(false);
                  navigate(config.routes.list);
                }}
              >
                Xem toàn bộ thông báo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
