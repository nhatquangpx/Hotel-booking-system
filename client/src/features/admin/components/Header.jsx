import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FaBars, FaTimes, FaUser, FaKey, FaSignOutAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { setLogout } from '@/store/slices/userSlice';
import { useAuth } from '@/shared/hooks';
import { IMAGE_PATHS } from '@/constants/images';
import './Header.scss';

/**
 * Header Component
 * Admin header with page title and user menu
 */
const Header = ({ isSidebarCollapsed, onToggleSidebar }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const handleLogout = () => {
    dispatch(setLogout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const getPageTitle = () => {
    if (location.pathname === '/admin') return 'Dashboard';
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

  return (
    <>
      <header className="admin-header">
        <div className="header-left">
          <button 
            className="sidebar-toggle-btn"
            onClick={onToggleSidebar}
            title={isSidebarCollapsed ? 'Mở sidebar' : 'Đóng sidebar'}
          >
            {isSidebarCollapsed ? <FaBars /> : <FaTimes />}
          </button>
          <h1>{getPageTitle()}</h1>
        </div>
        <div className="header-right">
          <div className="user-menu">
            <button 
              className="user-menu-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <img 
                src={IMAGE_PATHS.DEFAULT_PROFILE} 
                alt="Profile" 
                className="user-avatar"
              />
              <span className="user-name">{user?.name || 'Admin'}</span>
              {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {isDropdownOpen && (
              <div className="user-dropdown">
                {user?.id && (
                  <>
                    <Link 
                      to={`/profile/${user.id}`}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FaUser />
                      Thông tin tài khoản
                    </Link>
                    <Link 
                      to={`/profile/${user.id}/changepassword`}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FaKey />
                      Đổi mật khẩu
                    </Link>
                  </>
                )}
                <button onClick={handleLogout} className="logout-button">
                  <FaSignOutAlt />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {isDropdownOpen && (
        <div 
          className="dropdown-overlay" 
          onClick={() => setIsDropdownOpen(false)}
        ></div>
      )}
    </>
  );
};

export default Header;

