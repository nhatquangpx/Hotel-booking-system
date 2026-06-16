import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminDashboardAPI, adminRecentActivitiesAPI } from '@/apis/admin/dashboard';
import { formatCurrency } from '@/shared/utils';
import './AdminDashboard.scss';

const STAT_CARDS = [
  {
    key: 'users',
    className: 'users',
    title: 'Tổng người dùng',
    description: 'Tổng số tài khoản đã đăng ký',
    to: '/admin/users',
    getValue: (stats) => stats.totalUsers,
  },
  {
    key: 'hotels',
    className: 'hotels',
    title: 'Tổng số khách sạn',
    description: 'Khách sạn có trong hệ thống',
    to: '/admin/hotels',
    getValue: (stats) => stats.totalHotels,
  },
  {
    key: 'rooms',
    className: 'rooms',
    title: 'Tổng số phòng',
    description: 'Phòng có sẵn trong hệ thống',
    to: '/admin/hotels',
    getValue: (stats) => stats.totalRooms,
  },
  {
    key: 'bookings',
    className: 'bookings',
    title: 'Đặt phòng',
    description: 'Tổng số lượt đặt phòng',
    to: '/admin/bookings',
    getValue: (stats) => stats.totalBookings,
  },
  {
    key: 'revenue',
    className: 'revenue',
    title: 'Doanh thu',
    description: 'Tổng doanh thu',
    to: '/admin/bookings',
    getValue: (stats) => formatCurrency(stats.revenue),
  },
];

/**
 * Admin Dashboard component
 * Metric và hoạt động gần đây
 */
export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    totalHotels: 0,
    totalBookings: 0,
    revenue: 0,
  });
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminDashboardAPI.getStats();
        setStats(data);
      } catch (err) {
        console.error('Error fetching stats:', err);
      }
    };
    const fetchActivities = async () => {
      try {
        const data = await adminRecentActivitiesAPI.getRecentActivities();
        setActivities(data);
      } catch (err) {
        console.error('Error fetching activities:', err);
      }
    };
    fetchStats();
    fetchActivities();
  }, []);

  return (
    <div className="admin-dashboard">
      <div className="stats-container">
        {STAT_CARDS.map(({ key, className, title, description, to, getValue }) => (
          <Link
            key={key}
            to={to}
            className={`stat-card stat-card--link ${className}`}
            aria-label={`${title} — ${description}`}
          >
            <div className="stat-title">{title}</div>
            <div className="stat-value">{getValue(stats)}</div>
            <div className="stat-description">{description}</div>
            <span className="stat-card__cta">Xem chi tiết →</span>
          </Link>
        ))}
      </div>

      <h2>Hoạt động gần đây</h2>
      <div className="recent-activities">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Thời gian</th>
              <th>Người dùng</th>
              <th>Hoạt động</th>
            </tr>
          </thead>
          <tbody>
            {activities.length > 0 ? activities.map((act, idx) => (
              <tr key={idx}>
                <td>{act.time ? new Date(act.time).toLocaleString('vi-VN') : ''}</td>
                <td>{act.user || ''}</td>
                <td>{act.action || ''}</td>
              </tr>
            )) : (
              <tr>
                <td colSpan="3" style={{textAlign: 'center'}}>Không có hoạt động gần đây</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
