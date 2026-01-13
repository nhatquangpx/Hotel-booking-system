import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { FaBars, FaTimes, FaUser, FaKey, FaSignOutAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { setLogout, setLogin } from '@/store/slices/userSlice';
import { useAuth } from '@/shared/hooks';
import api from '@/apis';
import { IMAGE_PATHS } from '@/constants/images';
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
  className = ''
}) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userProfile, setUserProfile] = useState(null);

  // Fetch user profile nếu là owner và chưa có name đầy đủ
  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user?.role === 'owner' && token && (!user?.name || user?.name === 'User')) {
        try {
          const profile = await api.ownerProfile.getProfile();
          if (profile) {
            setUserProfile(profile);
            // Cập nhật vào Redux store và localStorage
            dispatch(setLogin({ user: profile, token }));
            localStorage.setItem('user', JSON.stringify(profile));
          }
        } catch (error) {
          console.error('Lỗi khi tải thông tin người dùng:', error);
        }
      }
    };

    fetchUserProfile();
  }, [user?.role, user?.name, token, dispatch]);

  // Sử dụng userProfile nếu có, nếu không thì dùng user từ auth
  const displayUser = userProfile || user;

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
              </div>
              {isDropdownOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {isDropdownOpen && (
              <div className="user-dropdown">
                {displayUser?._id && (
                  <>
                    <Link 
                      to={`/profile/${displayUser._id}`}
                      onClick={() => setIsDropdownOpen(false)}
                    >
                      <FaUser />
                      Thông tin tài khoản
                    </Link>
                    <Link 
                      to={`/profile/${displayUser._id}/changepassword`}
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

