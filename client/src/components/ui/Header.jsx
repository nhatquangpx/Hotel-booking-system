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
 * Reusable header component with sidebar toggle and user menu
 */
const Header = ({ 
  isSidebarCollapsed, 
  onToggleSidebar,
  getPageTitle,
  className = ''
}) => {
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

  const defaultGetPageTitle = () => {
    return 'Dashboard';
  };

  const title = getPageTitle ? getPageTitle(location) : defaultGetPageTitle();

  return (
    <>
      <header className={`app-header ${className}`}>
        <div className="header-left">
          {onToggleSidebar && (
            <button 
              className="sidebar-toggle-btn"
              onClick={onToggleSidebar}
              title={isSidebarCollapsed ? 'Mở sidebar' : 'Đóng sidebar'}
            >
              {isSidebarCollapsed ? <FaBars /> : <FaTimes />}
            </button>
          )}
          <h1>{title}</h1>
        </div>
        <div className="header-right">
          <div className="user-menu">
            <button 
              className="user-menu-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-initials">
                  {user?.name 
                    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'U'
                  }
                </div>
              )}
              <div className="user-info">
                <span className="user-name">{user?.name || 'User'}</span>
                {user?.role === 'owner' && (
                  <span className="user-role">Chủ khách sạn</span>
                )}
              </div>
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

