import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '@/components';
import { useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaBed, 
  FaCalendarCheck, 
  FaDollarSign, 
  FaChartBar, 
  FaWrench, 
  FaUsers 
} from 'react-icons/fa';
import './OwnerLayout.scss';

const SIDEBAR_STORAGE_KEY = 'owner_sidebar_collapsed';

/**
 * Owner Layout Component
 * Main layout wrapper for owner pages
 * Contains Sidebar and Header components
 */
const OwnerLayout = ({ children }) => {
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
    if (location.pathname === '/owner') return 'Tổng quan';
    if (location.pathname.includes('/owner/rooms')) {
      if (location.pathname.includes('/create')) return 'Tạo phòng mới';
      if (location.pathname.includes('/edit')) return 'Chỉnh sửa phòng';
      if (location.pathname.match(/\/owner\/rooms\/[^/]+$/)) return 'Chi tiết phòng';
      return 'Sơ đồ phòng';
    }
    if (location.pathname.includes('/owner/bookings')) {
      if (location.pathname.match(/\/owner\/bookings\/[^/]+$/)) return 'Chi tiết đặt phòng';
      return 'Đặt phòng';
    }
    if (location.pathname.includes('/owner/revenue')) return 'Thu chi';
    if (location.pathname.includes('/owner/reports')) return 'Báo cáo';
    if (location.pathname.includes('/owner/assets')) return 'Tài sản';
    if (location.pathname.includes('/owner/customers')) return 'Khách hàng';
    return 'Quản lý khách sạn';
  };

  const menuItems = [
    { path: '/owner', label: 'Tổng quan', icon: FaHome, title: 'Tổng quan' },
    { path: '/owner/rooms', label: 'Sơ đồ phòng', icon: FaBed, title: 'Sơ đồ phòng' },
    { path: '/owner/bookings', label: 'Đặt phòng', icon: FaCalendarCheck, title: 'Đặt phòng' },
    { path: '/owner/revenue', label: 'Thu chi', icon: FaDollarSign, title: 'Thu chi' },
    { path: '/owner/reports', label: 'Báo cáo', icon: FaChartBar, title: 'Báo cáo' },
    { path: '/owner/assets', label: 'Tài sản', icon: FaWrench, title: 'Tài sản' },
    { path: '/owner/customers', label: 'Khách hàng', icon: FaUsers, title: 'Khách hàng' },
  ];

  return (
    <div className={`owner-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar 
        isCollapsed={isSidebarCollapsed}
        menuItems={menuItems}
        logoLink="/owner"
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

export default OwnerLayout;

