import React, { useState, useEffect } from 'react'
import { Link, Routes, Route, Outlet } from 'react-router-dom'
import AdminLayout from './AdminLayout'
import UserList from './UserList'
import './AdminComponents.scss'

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRooms: 0,
    totalBookings: 0,
    revenue: 0
  });
  
  // Trong thực tế, bạn sẽ cần gọi API để lấy các thống kê này
  useEffect(() => {
    const fetchStats = async () => {
      // Giả lập dữ liệu thống kê
      setStats({
        totalUsers: 24,
        totalRooms: 42,
        totalBookings: 85,
        revenue: 158750000
      });
    };
    
    fetchStats();
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
        
        <Link to="/admin/rooms" className="quick-access-card">
          <div className="card-icon">🏨</div>
          <div className="card-title">Quản lý phòng</div>
          <div className="card-description">Quản lý danh sách phòng và loại phòng</div>
        </Link>
        
        <Link to="/admin/bookings" className="quick-access-card">
          <div className="card-icon">📅</div>
          <div className="card-title">Quản lý đặt phòng</div>
          <div className="card-description">Xem và quản lý các đơn đặt phòng</div>
        </Link>
        
        <Link to="/admin/settings" className="quick-access-card">
          <div className="card-icon">⚙️</div>
          <div className="card-title">Cài đặt hệ thống</div>
          <div className="card-description">Thay đổi cài đặt hệ thống</div>
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
            <tr>
              <td>10:30 18/07/2023</td>
              <td>Nguyễn Văn A</td>
              <td>Đặt phòng Deluxe từ 20/07 đến 25/07</td>
            </tr>
            <tr>
              <td>09:15 18/07/2023</td>
              <td>Trần Thị B</td>
              <td>Hủy đặt phòng #00123</td>
            </tr>
            <tr>
              <td>18:45 17/07/2023</td>
              <td>Lê Văn C</td>
              <td>Đăng ký tài khoản mới</td>
            </tr>
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