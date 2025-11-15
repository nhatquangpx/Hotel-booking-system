import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '@/components';
import { FaHome, FaUsers, FaHotel, FaCalendarCheck } from 'react-icons/fa';
import { useLocation } from 'react-router-dom';
import './AdminLayout.scss';

const SIDEBAR_STORAGE_KEY = 'admin_sidebar_collapsed';

/**
 * Admin Layout Component
 * Main layout wrapper for admin pages
 * Contains Sidebar and Header components
 */
const AdminLayout = ({ children }) => {
  const location = useLocation();
  
  // Khôi phục trạng thái sidebar từ localStorage, mặc định là false (mở)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    return saved ? JSON.parse(saved) : false;
  });

  // Lưu trạng thái vào localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed(prev => !prev);
  };

  const getPageTitle = (location) => {
    if (location.pathname === '/admin') return 'Tổng quan';
    if (location.pathname.includes('/admin/users')) {
      if (location.pathname.includes('/create')) return 'Tạo người dùng mới';
      if (location.pathname.includes('/edit')) return 'Chỉnh sửa người dùng';
      if (location.pathname.match(/\/admin\/users\/[^/]+$/)) return 'Chi tiết người dùng';
      return 'Quản lý người dùng';
    }
    if (location.pathname.includes('/admin/hotels')) {
      if (location.pathname.includes('/create')) return 'Tạo khách sạn mới';
      if (location.pathname.includes('/edit')) return 'Chỉnh sửa khách sạn';
      if (location.pathname.includes('/rooms/create')) return 'Tạo phòng mới';
      if (location.pathname.match(/\/admin\/hotels\/[^/]+$/)) return 'Chi tiết khách sạn';
      return 'Quản lý khách sạn';
    }
    if (location.pathname.includes('/admin/rooms')) {
      if (location.pathname.includes('/edit')) return 'Chỉnh sửa phòng';
      return 'Chi tiết phòng';
    }
    if (location.pathname.includes('/admin/bookings')) {
      if (location.pathname.match(/\/admin\/bookings\/[^/]+$/)) return 'Chi tiết đặt phòng';
      return 'Quản lý đặt phòng';
    }
    return 'Admin';
  };

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: FaHome, title: 'Dashboard' },
    { path: '/admin/users', label: 'Quản lý người dùng', icon: FaUsers, title: 'Quản lý người dùng' },
    { path: '/admin/hotels', label: 'Quản lý khách sạn', icon: FaHotel, title: 'Quản lý khách sạn' },
    { path: '/admin/bookings', label: 'Quản lý đặt phòng', icon: FaCalendarCheck, title: 'Quản lý đặt phòng' },
  ];

  return (
    <div className={`admin-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        menuItems={menuItems}
        logoLink="/admin"
      />
      <main className="content">
        <Header 
          isSidebarCollapsed={isSidebarCollapsed} 
          onToggleSidebar={toggleSidebar}
          getPageTitle={getPageTitle}
        />
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;

