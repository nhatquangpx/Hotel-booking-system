import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import { FaFileExcel } from 'react-icons/fa';
import { adminDashboardAPI, adminRecentActivitiesAPI } from '@/apis/admin/dashboard';
import { adminHotelAPI } from '@/apis/admin/hotel';
import { formatCurrency } from '@/shared/utils';
import './AdminDashboard.scss';

const formatYmd = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const defaultReportRange = () => {
  const to = new Date();
  to.setHours(0, 0, 0, 0);
  const from = new Date(to);
  from.setDate(from.getDate() - 6);
  return { from: formatYmd(from), to: formatYmd(to) };
};

/**
 * Admin Dashboard component
 * Displays statistics and quick access for admin
 */
export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    totalHotels: 0,
    totalBookings: 0,
    revenue: 0
  });
  const [activities, setActivities] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [reportHotelId, setReportHotelId] = useState('');
  const [reportRange, setReportRange] = useState(defaultReportRange);
  const [exportingReport, setExportingReport] = useState(false);

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

  useEffect(() => {
    const loadHotels = async () => {
      try {
        const list = await adminHotelAPI.getAllHotels();
        setHotels(Array.isArray(list) ? list : []);
      } catch (err) {
        console.error('Error fetching hotels for report:', err);
      }
    };
    loadHotels();
  }, []);

  const handleExportReport = useCallback(async () => {
    if (exportingReport) return;
    setExportingReport(true);
    try {
      await adminDashboardAPI.downloadReportExcel({
        hotelId: reportHotelId || undefined,
        from: reportRange.from,
        to: reportRange.to
      });
    } catch (err) {
      console.error(err);
      toast.error(err?.message || 'Không thể xuất báo cáo');
    } finally {
      setExportingReport(false);
    }
  }, [exportingReport, reportHotelId, reportRange.from, reportRange.to]);

  return (
    <div className="admin-dashboard">
      <div className="admin-report-export">
        <div className="admin-report-export__head">
          <h3 className="admin-report-export__title">Xuất báo cáo Excel</h3>
          <div className="admin-report-export__hint">
            <p>
              <strong>Hướng dẫn:</strong> chọn <strong>khách sạn</strong> (hoặc để « Tất cả khách sạn » để gộp toàn
              hệ thống), chọn khoảng ngày, rồi bấm « Tải file Excel ».
            </p>
            <p>
              <strong>Nội dung file:</strong> có hai phần — <em>Tổng hợp kỳ</em> (tổng số phòng, doanh thu, số đơn
              và đêm phòng bán trong cả kỳ) và <em>Chi tiết theo ngày</em>. Doanh thu và số đơn được tính theo{' '}
              <strong>ngày tạo đơn</strong>, chỉ các đơn <strong>đã thanh toán</strong>; cột đêm phòng bán phản ánh
              số đêm đã bán trong từng ngày của kỳ báo cáo.
            </p>
          </div>
        </div>
        <div className="admin-report-export__controls">
          <label className="admin-report-export__field">
            <span>Khách sạn</span>
            <select
              value={reportHotelId}
              onChange={(e) => setReportHotelId(e.target.value)}
            >
              <option value="">Tất cả khách sạn</option>
              {hotels.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name || h._id}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-report-export__field">
            <span>Từ ngày</span>
            <input
              type="date"
              value={reportRange.from}
              onChange={(e) =>
                setReportRange((r) => ({ ...r, from: e.target.value }))
              }
            />
          </label>
          <label className="admin-report-export__field">
            <span>Đến ngày</span>
            <input
              type="date"
              value={reportRange.to}
              onChange={(e) =>
                setReportRange((r) => ({ ...r, to: e.target.value }))
              }
            />
          </label>
          <button
            type="button"
            className="admin-report-export__btn"
            disabled={exportingReport}
            onClick={handleExportReport}
          >
            <FaFileExcel aria-hidden />
            {exportingReport ? 'Đang tải…' : 'Tải file Excel'}
          </button>
        </div>
      </div>

      <div className="stats-container">
        <div className="stat-card users">
          <div className="stat-title">Tổng người dùng</div>
          <div className="stat-value">{stats.totalUsers}</div>
          <div className="stat-description">Tổng số tài khoản đã đăng ký</div>
        </div>
        
        <div className="stat-card hotels">
          <div className="stat-title">Tổng số khách sạn</div>
          <div className="stat-value">{stats.totalHotels}</div>
          <div className="stat-description">Khách sạn có trong hệ thống</div>
        </div>
        
        <div className="stat-card rooms">
          <div className="stat-title">Tổng số phòng</div>
          <div className="stat-value">{stats.totalRooms}</div>
          <div className="stat-description">Phòng có sẵn trong hệ thống</div>
        </div>
        
        <div className="stat-card bookings">
          <div className="stat-title">Đặt phòng</div>
          <div className="stat-value">{stats.totalBookings}</div>
          <div className="stat-description">Tổng số lượt đặt phòng</div>
        </div>
        
        <div className="stat-card revenue">
          <div className="stat-title">Doanh thu</div>
          <div className="stat-value">{formatCurrency(stats.revenue)}</div>
          <div className="stat-description">Tổng doanh thu</div>
        </div>
      </div>
      
      <h2>Truy cập nhanh</h2>
      
      <div className="quick-access-cards">
        <Link to="/admin/users" className="quick-access-card">
          <div className="card-icon">👥</div>
          <div className="card-title">Quản lý người dùng</div>
          <div className="card-description">Xem, thêm, sửa, xóa người dùng</div>
        </Link>
        
        <Link to="/admin/hotels" className="quick-access-card">
          <div className="card-icon">🏨</div>
          <div className="card-title">Quản lý khách sạn</div>
          <div className="card-description">Quản lý khách sạn và danh sách phòng</div>
        </Link>
        
        <Link to="/admin/bookings" className="quick-access-card">
          <div className="card-icon">📅</div>
          <div className="card-title">Quản lý đặt phòng</div>
          <div className="card-description">Xem và quản lý các đơn đặt phòng</div>
        </Link>
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

