import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '@/components';
import {
  FaHome,
  FaBed,
  FaCalendarCheck,
  FaWrench,
  FaCommentDots,
} from 'react-icons/fa';
import { readLocalStorageBoolean } from '@/shared/utils';
import StaffHotelBadge from './StaffHotelBadge';
import './StaffLayout.scss';

const SIDEBAR_STORAGE_KEY = 'staff_sidebar_collapsed';

/**
 * Staff Layout — shell dùng chung Sidebar/Header giống owner
 */
const StaffLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() =>
    readLocalStorageBoolean(SIDEBAR_STORAGE_KEY, false)
  );

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, JSON.stringify(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const toggleSidebar = () => {
    setIsSidebarCollapsed((prev) => !prev);
  };

  const getPageTitle = (loc) => {
    if (loc.pathname === '/staff') return 'Tổng quan';
    if (loc.pathname.includes('/staff/rooms')) return 'Sơ đồ phòng';
    if (loc.pathname.includes('/staff/bookings')) return 'Đặt phòng';
    if (loc.pathname.includes('/staff/equipment')) return 'Thiết bị';
    if (loc.pathname.includes('/staff/reviews')) return 'Đánh giá';
    if (loc.pathname.includes('/staff/notifications')) return 'Thông báo';
    return 'Nhân viên khách sạn';
  };

  const menuItems = [
    { path: '/staff', label: 'Tổng quan', icon: FaHome, title: 'Tổng quan' },
    { path: '/staff/rooms', label: 'Sơ đồ phòng', icon: FaBed, title: 'Sơ đồ phòng' },
    {
      path: '/staff/bookings',
      label: 'Đặt phòng',
      icon: FaCalendarCheck,
      title: 'Đặt phòng',
    },
    { path: '/staff/equipment', label: 'Thiết bị', icon: FaWrench, title: 'Thiết bị' },
    { path: '/staff/reviews', label: 'Đánh giá', icon: FaCommentDots, title: 'Đánh giá' },
  ];

  return (
    <div className={`staff-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        menuItems={menuItems}
        logoLink="/staff"
      />
      <main className="content">
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={toggleSidebar}
          getPageTitle={getPageTitle}
          headerExtra={<StaffHotelBadge />}
        />
        <div className="content-body">{children}</div>
      </main>
    </div>
  );
};

export default StaffLayout;
