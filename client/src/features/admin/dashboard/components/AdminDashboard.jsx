import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { FaHistory, FaEnvelope, FaChartBar } from 'react-icons/fa';
import {
  adminDashboardAPI,
  adminRecentActivitiesAPI,
  REVENUE_PERIOD_OPTIONS,
  REVENUE_PERIODS,
} from '@/apis/admin/dashboard';
import { ROUTES } from '@/constants/routes';
import { formatCurrency } from '@/shared/utils';
import DashboardPanel from '@/features/staff/dashboard/components/DashboardPanel';
import HotelRevenueChart from './HotelRevenueChart';
import './AdminDashboard.scss';

const PANEL_PAGE_SIZE = 5;

const STAT_CARDS = [
  {
    key: 'users',
    className: 'users',
    title: 'Tổng người dùng',
    description: 'Tổng số tài khoản đã đăng ký',
    to: ROUTES.ADMIN_USERS,
    getValue: (stats) => stats.totalUsers,
  },
  {
    key: 'hotels',
    className: 'hotels',
    title: 'Tổng số khách sạn',
    description: 'Khách sạn có trong hệ thống',
    to: ROUTES.ADMIN_HOTELS,
    getValue: (stats) => stats.totalHotels,
  },
  {
    key: 'rooms',
    className: 'rooms',
    title: 'Tổng số phòng',
    description: 'Phòng có sẵn trong hệ thống',
    to: ROUTES.ADMIN_HOTELS,
    getValue: (stats) => stats.totalRooms,
  },
  {
    key: 'bookings',
    className: 'bookings',
    title: 'Đặt phòng',
    description: 'Tổng số lượt đặt phòng',
    to: ROUTES.ADMIN_BOOKINGS,
    getValue: (stats) => stats.totalBookings,
  },
  {
    key: 'revenue',
    className: 'revenue',
    title: 'Doanh thu',
    description: 'Tổng doanh thu',
    to: ROUTES.ADMIN_BOOKINGS,
    getValue: (stats) => formatCurrency(stats.revenue),
  },
];

const formatActivityTime = (time) => {
  if (!time) return '';
  return new Date(time).toLocaleString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const contactStatusBadge = (contact) => {
  if (!contact.isRead) {
    return <span className="admin-dash-badge admin-dash-badge--unread">Chưa đọc</span>;
  }
  if (!contact.replied) {
    return <span className="admin-dash-badge admin-dash-badge--pending">Chưa phản hồi</span>;
  }
  return null;
};

/**
 * Admin Dashboard — metric, xếp hạng doanh thu theo KS, log hoạt động, liên hệ.
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
  const [pendingContacts, setPendingContacts] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState(REVENUE_PERIODS.WEEK);
  const [revenueByHotel, setRevenueByHotel] = useState({
    periodLabel: '',
    hotels: [],
  });
  const [chartLoading, setChartLoading] = useState(true);
  const [loading, setLoading] = useState(true);

  const fetchRevenueByHotel = useCallback(async (period) => {
    try {
      setChartLoading(true);
      setRevenueByHotel((prev) => ({ ...prev, hotels: [] }));
      const data = await adminDashboardAPI.getRevenueByHotel(period);
      setRevenueByHotel({
        periodLabel: data.periodLabel || '',
        hotels: data.hotels || [],
      });
    } catch (err) {
      console.error('Error fetching revenue by hotel:', err);
      setRevenueByHotel({ periodLabel: '', hotels: [] });
    } finally {
      setChartLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchStaticData = async () => {
      try {
        setLoading(true);
        const [statsData, activitiesData, contactsData] = await Promise.all([
          adminDashboardAPI.getStats(),
          adminRecentActivitiesAPI.getRecentActivities(),
          adminDashboardAPI.getPendingContacts(20),
        ]);
        setStats(statsData);
        setActivities(activitiesData || []);
        setPendingContacts(contactsData || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStaticData();
  }, []);

  useEffect(() => {
    fetchRevenueByHotel(revenuePeriod);
  }, [revenuePeriod, fetchRevenueByHotel]);

  const activityItems = useMemo(
    () =>
      activities.map((act, idx) => ({
        id: `${act.type || 'activity'}-${act.entityId || idx}`,
        main: act.action || '',
        meta: `${formatActivityTime(act.time)} · ${act.user || 'Hệ thống'}`,
      })),
    [activities]
  );

  const contactItems = useMemo(
    () =>
      pendingContacts.map((contact) => ({
        id: contact.id,
        main: (
          <>
            {contactStatusBadge(contact)}
            {contact.subject || 'Liên hệ không tiêu đề'}
          </>
        ),
        meta: `${contact.name} · ${contact.email} · ${formatActivityTime(contact.createdAt)}`,
        linkTo: ROUTES.ADMIN_CONTACT_MESSAGES,
      })),
    [pendingContacts]
  );

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

      <section className="admin-dashboard__chart-card">
        <header className="admin-dashboard__chart-header">
          <div className="admin-dashboard__chart-title-row">
            <span className="admin-dashboard__chart-icon" aria-hidden>
              <FaChartBar />
            </span>
            <div>
              <h2>Doanh thu theo khách sạn</h2>
              <p className="admin-dashboard__chart-subtitle">
                {revenueByHotel.periodLabel || 'Theo kỳ đã chọn'} · đơn đã thanh toán
              </p>
            </div>
          </div>
          <div
            className="admin-dashboard__period-selector"
            role="group"
            aria-label="Chọn kỳ thống kê"
          >
            {REVENUE_PERIOD_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`view-mode-option${revenuePeriod === value ? ' is-active' : ''}`}
                onClick={() => setRevenuePeriod(value)}
              >
                {label}
              </button>
            ))}
          </div>
        </header>
        <HotelRevenueChart
          data={revenueByHotel.hotels}
          periodLabel={revenueByHotel.periodLabel}
          loading={chartLoading}
          pageSize={PANEL_PAGE_SIZE}
          viewAllTo={revenueByHotel.hotels.length > 0 ? ROUTES.ADMIN_BOOKINGS : undefined}
          viewAllLabel="Mở trang đặt phòng"
        />
      </section>

      <div className="admin-dashboard__panels">
        <DashboardPanel
          icon={FaHistory}
          title="Nhật ký hoạt động"
          subtitle="Sự kiện mới trên hệ thống"
          items={activityItems}
          emptyText={loading ? 'Đang tải…' : 'Không có hoạt động gần đây'}
          pageSize={PANEL_PAGE_SIZE}
          className="admin-dashboard__panel"
        />

        <DashboardPanel
          icon={FaEnvelope}
          title="Liên hệ cần xử lý"
          subtitle="Chưa đọc hoặc chưa phản hồi"
          items={contactItems}
          emptyText={loading ? 'Đang tải…' : 'Không có liên hệ cần xử lý'}
          pageSize={PANEL_PAGE_SIZE}
          viewAllTo={pendingContacts.length > 0 ? ROUTES.ADMIN_CONTACT_MESSAGES : undefined}
          viewAllLabel="Mở trang liên hệ"
          className="admin-dashboard__panel"
        />
      </div>
    </div>
  );
};
