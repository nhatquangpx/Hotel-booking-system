import React, { useState, useEffect } from 'react';
import { Header, Sidebar } from '@/components';
import {
  FaHome,
  FaBed,
  FaCalendarCheck,
  FaWrench,
  FaCommentDots,
  FaConciergeBell,
} from 'react-icons/fa';
import { ROUTES } from '@/constants/routes';
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
    if (loc.pathname.includes('/staff/addon-services')) return 'Dịch vụ đi kèm';
    if (loc.pathname.includes('/staff/equipment')) return 'Thiết bị';
    if (loc.pathname.includes('/staff/reviews')) return 'Đánh giá';
    if (loc.pathname.includes('/staff/notifications')) return 'Thông báo';
    if (loc.pathname.includes('/staff/profile/changepassword')) return 'Đổi mật khẩu';
    if (loc.pathname.includes('/staff/profile/edit')) return 'Chỉnh sửa thông tin';
    if (loc.pathname.includes('/staff/profile')) return 'Thông tin tài khoản';
    return 'Nhân viên khách sạn';
  };

  const menuItems = [
    { path: ROUTES.STAFF_HOME, label: 'Tổng quan', icon: FaHome, title: 'Tổng quan' },
    { path: ROUTES.STAFF_ROOMS, label: 'Sơ đồ phòng', icon: FaBed, title: 'Sơ đồ phòng' },
    {
      path: ROUTES.STAFF_BOOKINGS,
      label: 'Đặt phòng',
      icon: FaCalendarCheck,
      title: 'Đặt phòng',
    },
    { path: ROUTES.STAFF_ADDON_SERVICES, label: 'Dịch vụ', icon: FaConciergeBell, title: 'Dịch vụ đi kèm' },
    { path: ROUTES.STAFF_EQUIPMENT, label: 'Thiết bị', icon: FaWrench, title: 'Thiết bị' },
    { path: ROUTES.STAFF_REVIEWS, label: 'Đánh giá', icon: FaCommentDots, title: 'Đánh giá' },
  ];

  return (
    <div className={`staff-layout ${isSidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        menuItems={menuItems}
        logoLink={ROUTES.STAFF_HOME}
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
