import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '@/components';
import { useLocation } from 'react-router-dom';
import { 
  FaHome, 
  FaBed, 
  FaCalendarCheck, 
  FaUsers,
  FaChartLine,
  FaTags,
  FaWrench
} from 'react-icons/fa';
import { readLocalStorageBoolean } from '@/shared/utils';
import OwnerHotelSelect from './OwnerHotelSelect';
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
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    readLocalStorageBoolean(SIDEBAR_STORAGE_KEY, false)
  );

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
    if (location.pathname.includes('/owner/equipment')) return 'Trang thiết bị';
    if (location.pathname.includes('/owner/reviews')) return 'Đánh giá';
    if (location.pathname.includes('/owner/pricing')) return 'Giá động';
    if (location.pathname.includes('/owner/sale')) return 'Khuyến mãi';
    if (location.pathname.includes('/owner/notifications')) return 'Thông báo';
    return 'Quản lý khách sạn';
  };

  const menuItems = [
    { path: '/owner', label: 'Tổng quan', icon: FaHome, title: 'Tổng quan' },
    { path: '/owner/rooms', label: 'Sơ đồ phòng', icon: FaBed, title: 'Sơ đồ phòng' },
    { path: '/owner/bookings', label: 'Đặt phòng', icon: FaCalendarCheck, title: 'Đặt phòng' },
    { path: '/owner/equipment', label: 'Thiết bị', icon: FaWrench, title: 'Thiết bị' },
    { path: '/owner/pricing', label: 'Giá động', icon: FaChartLine, title: 'Giá động' },
    { path: '/owner/sale', label: 'Khuyến mãi', icon: FaTags, title: 'Khuyến mãi' },
    { path: '/owner/reviews', label: 'Đánh giá', icon: FaUsers, title: 'Đánh giá' },
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
          headerExtra={<OwnerHotelSelect />}
        />
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
};

export default OwnerLayout;

