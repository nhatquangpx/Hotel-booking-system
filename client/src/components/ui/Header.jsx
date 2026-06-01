import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FaBars, FaTimes, FaUser, FaKey, FaSignOutAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { setUser } from '@/store/slices/userSlice';
import { performLogout } from '@/shared/utils/authSession';
import { useAuth } from '@/shared/hooks';
import api from '@/apis';
import {
  profileChangePasswordPathForRole,
  profilePathForRole,
} from '@/constants/routes';
import { NotificationBell } from '@/features/notifications';
import './Header.scss';

/**
 * Header Component
 * Reusable header component with sidebar toggle and user menu
 */
const Header = ({ 
  isSidebarCollapsed, 
  onToggleSidebar,
  getPageTitle,
  headerExtra,
  className = ''
}) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile nếu là owner/admin và chưa có name đầy đủ hoặc thiếu _id
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (isAuthenticated && (user?.role === 'owner' || user?.role === 'admin' || user?.role === 'staff')) {
        // Kiểm tra nếu thiếu name hoặc _id (hoặc chỉ có id)
        const hasId = user?.id || user?._id;
        const needsFetch = !user?.name || user?.name === 'User' || !user?._id;
        
        if (needsFetch && hasId) {
          try {
            let profile;
            if (user?.role === 'owner') {
              profile = await api.ownerProfile.getProfile();
            } else if (user?.role === 'admin') {
              profile = await api.adminProfile.getProfile();
            } else if (user?.role === 'staff') {
              profile = await api.staffProfile.getProfile();
            }
            
            if (profile) {
              setUserProfile(profile);
              dispatch(setUser(profile));
            }
          } catch (error) {
            console.error('Lỗi khi tải thông tin người dùng:', error);
          }
        }
      }
    };

    fetchUserProfile();
  }, [user?.role, user?.name, user?._id, user?.id, isAuthenticated, dispatch]);

  // Sử dụng userProfile nếu có, nếu không thì dùng user từ auth
  const displayUser = userProfile || user;

  const handleLogout = async () => {
    await performLogout(dispatch);
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
          {headerExtra}
        </div>
        <div className="header-right">
          <NotificationBell />
          <div className="user-menu">
            <button 
              className="user-menu-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              {displayUser?.avatar ? (
                <img 
                  src={displayUser.avatar} 
                  alt="Profile" 
                  className="user-avatar"
                />
              ) : (
                <div className="user-avatar-initials">
                  {displayUser?.name 
                    ? displayUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
                    : 'U'
                  }
                </div>
              )}
              <div className="user-info">
                <span className="user-name">{displayUser?.name || 'User'}</span>
                {displayUser?.role === 'owner' && (
                  <span className="user-role">Chủ khách sạn</span>
                )}
                {displayUser?.role === 'admin' && (
                  <span className="user-role">Quản trị viên</span>
                )}
                {displayUser?.role === 'staff' && (
                  <span className="user-role">Nhân viên khách sạn</span>
                )}
              </div>
              {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {isDropdownOpen && (
              <div className="user-dropdown">
                {displayUser && (
                  <>
                    <Link
                      to={profilePathForRole(displayUser.role)}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FaUser />
                      Thông tin tài khoản
                    </Link>
                    <Link
                      to={profileChangePasswordPathForRole(displayUser.role)}
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

