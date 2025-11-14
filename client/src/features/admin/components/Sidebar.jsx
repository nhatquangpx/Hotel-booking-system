import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FaHome, FaUsers, FaHotel, FaCalendarCheck } from 'react-icons/fa';
import { IMAGE_PATHS } from '@/constants/images';
import './Sidebar.scss';

/**
 * Sidebar Component
 * Admin sidebar navigation menu
 */
const Sidebar = ({ isCollapsed }) => {
  const location = useLocation();

  return (
    <aside className={`admin-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="admin-sidebar-header">
        <Link to="/admin" className="logo-link">
          <img 
            src={IMAGE_PATHS.LOGO_VERTICAL} 
            alt="Logo" 
            className="sidebar-logo"
          />
        </Link>
      </div>
      <nav className="admin-sidebar-nav">
        <ul>
          <li>
            <Link 
              to="/admin" 
              className={location.pathname === '/admin' ? 'active' : ''}
              title="Dashboard"
              onClick={(e) => {
                // Chỉ navigate, không toggle sidebar
                e.stopPropagation();
              }}
            >
              <FaHome className="menu-icon" />
              {!isCollapsed && <span>Dashboard</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/users" 
              className={location.pathname.includes('/admin/users') ? 'active' : ''}
              title="Quản lý người dùng"
              onClick={(e) => {
                // Chỉ navigate, không toggle sidebar
                e.stopPropagation();
              }}
            >
              <FaUsers className="menu-icon" />
              {!isCollapsed && <span>Quản lý người dùng</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/hotels" 
              className={location.pathname.includes('/admin/hotels') ? 'active' : ''}
              title="Quản lý khách sạn"
              onClick={(e) => {
                // Chỉ navigate, không toggle sidebar
                e.stopPropagation();
              }}
            >
              <FaHotel className="menu-icon" />
              {!isCollapsed && <span>Quản lý khách sạn</span>}
            </Link>
          </li>
          <li>
            <Link 
              to="/admin/bookings" 
              className={location.pathname.includes('/admin/bookings') ? 'active' : ''}
              title="Quản lý đặt phòng"
              onClick={(e) => {
                // Chỉ navigate, không toggle sidebar
                e.stopPropagation();
              }}
            >
              <FaCalendarCheck className="menu-icon" />
              {!isCollapsed && <span>Quản lý đặt phòng</span>}
            </Link>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

