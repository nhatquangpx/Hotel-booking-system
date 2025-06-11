import React, { useState, useEffect } from 'react'
import { Link, Routes, Route, Outlet } from 'react-router-dom'
import AdminLayout from '../../../components/Admin/AdminLayout'
import UserList from '../ManageUser/UserList'
import '../../../components/Admin/AdminComponents.scss'
import { adminDashboardAPI, adminRecentActivitiesAPI } from '../../../apis/admin/dashboard'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    totalHotels: 0,
    totalBookings: 0,
    revenue: 0
  });
  const [activities, setActivities] = useState([]);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await adminDashboardAPI.getStats();
        setStats(data);
      } catch (err) {
        // Xử lý lỗi nếu cần
      }
    };
    const fetchActivities = async () => {
      try {
        const data = await adminRecentActivitiesAPI.getRecentActivities();
        setActivities(data);
      } catch (err) {
        // Xử lý lỗi nếu cần
      }
    };
    fetchStats();
    fetchActivities();
  }, []);
  
  // Format số tiền VND
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };
  
  return (
    <div className="admin-dashboard">
      <h2>Thống kê tổng quan</h2>
      
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
  )
}

// Component chứa nội dung chính của trang Admin - bên trong AdminLayout
const AdminContent = () => {
  return (
    <Routes>
      <Route index element={<AdminDashboard />} />
      <Route path="users" element={<UserList />} />
      {/* Các route khác sẽ thêm sau */}
    </Routes>
  );
};

// Trang Admin chính - luôn bao gồm AdminLayout
const AdminPage = () => {
  return (
    <AdminLayout>
      <AdminContent />
    </AdminLayout>
  );
};

export default AdminPage