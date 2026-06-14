import { IconButton } from "@mui/material"
import { useState, useEffect, useRef } from 'react'
import { Search, Hotel, Favorite, AccountCircle, Logout, KeyboardArrowDown, Menu, Close } from "@mui/icons-material"
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { performLogout } from '@/shared/utils/authSession'
import { ROLES } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import { IMAGE_PATHS } from '@/constants/images'
import { NotificationBell } from '@/features/notifications'
import "./Navbar.scss"

export const Navbar = () => {
  const [dropdownMenu, setDropdownMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const routerLocation = useLocation();
  const dropdownRef = useRef(null);

  const userState = useSelector((state) => state.user || {}); 
  const user = userState?.user || null; 

  const dispatch = useDispatch();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownMenu(false);
      }
    };

    if (dropdownMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [dropdownMenu]);

  useEffect(() => {
    setMobileMenuOpen(false);
    setDropdownMenu(false);
  }, [routerLocation.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return undefined;

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [mobileMenuOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setMobileMenuOpen(false);
    navigate(`/hotels?search=${encodeURIComponent(searchQuery)}`);
  };

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/hotels', label: 'Khách sạn' },
    { to: '/about', label: 'Giới thiệu' },
    { to: '/contact', label: 'Liên hệ' },
  ];

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
    setDropdownMenu(false);
  };

  return (
    <>
    <div className={`navbar ${mobileMenuOpen ? 'navbar--mobile-open' : ''}`}>
      <a href="/">
        <img src={IMAGE_PATHS.LOGO_VERTICAL_WHITE} alt="logo" />
      </a>

      <div className='navbar_menu navbar_menu--desktop'>
        {navLinks.map((item) => (
          <Link key={item.to} to={item.to} className="menu-item">
            {item.label}
          </Link>
        ))}
      </div>

      <form className='navbar_search' onSubmit={handleSearch}>
        <input 
          type="text" 
          placeholder='Tìm khách sạn hoặc địa danh...' 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <IconButton type="submit">
          <Search sx={{ color: '#ffffff' }} />
        </IconButton>
      </form>

      <div className='navbar_right'>
        {user && <NotificationBell />}
        
        {!user ? (
          <div className="navbar_right_auth_buttons">
            <Link to="/register" className="navbar_auth_button navbar_auth_button_register">
              Đăng ký
            </Link>
            <Link
              to="/login"
              state={{ from: routerLocation }}
              className="navbar_auth_button navbar_auth_button_login"
            >
              Đăng nhập
            </Link>
          </div>
        ) : (
          <div className="navbar_right_account_wrapper" ref={dropdownRef}>
            <button className='navbar_right_account' onClick={() => setDropdownMenu(!dropdownMenu)}>
              <div className="navbar_right_account_avatar">
                <img
                  src="/assets/default-profile.jpg"
                  alt="profile"
                  className="navbar_right_account_avatar_img"
                />
                <KeyboardArrowDown 
                  sx={{ 
                    color: '#ffffff', 
                    fontSize: 16,
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    background: '#fa002a',
                    borderRadius: '50%',
                    padding: '2px'
                  }} 
                />
              </div>
            </button>

            {dropdownMenu && user && (
              <div className="navbar_right_accountmenu">
                <Link to="/my-bookings" onClick={() => setDropdownMenu(false)}>
                  <Hotel sx={{ fontSize: 20, marginRight: 1 }} />
                  Đặt phòng của tôi
                </Link>
                {user.role === ROLES.GUEST && (
                  <Link to="/wishlist" onClick={() => setDropdownMenu(false)}>
                    <Favorite sx={{ fontSize: 20, marginRight: 1 }} />
                    Danh sách yêu thích
                  </Link>
                )}
                <Link to={ROUTES.PROFILE} onClick={() => setDropdownMenu(false)}>
                  <AccountCircle sx={{ fontSize: 20, marginRight: 1 }} />
                  Thông tin cá nhân
                </Link>
                <button
                  type="button"
                  className="navbar_right_accountmenu__logout"
                  onClick={async () => {
                    await performLogout(dispatch);
                    setDropdownMenu(false);
                    navigate('/login');
                  }}
                >
                  <Logout sx={{ fontSize: 20, marginRight: 1 }} />
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        type="button"
        className="navbar_toggle"
        onClick={toggleMobileMenu}
        aria-label={mobileMenuOpen ? 'Đóng menu' : 'Mở menu'}
        aria-expanded={mobileMenuOpen}
      >
        {mobileMenuOpen ? <Close sx={{ color: '#ffffff' }} /> : <Menu sx={{ color: '#ffffff' }} />}
      </button>
    </div>

    {mobileMenuOpen && (
      <button
        type="button"
        className="navbar_mobile_backdrop"
        aria-label="Đóng menu"
        onClick={closeMobileMenu}
      />
    )}

    <div className={`navbar_mobile_drawer ${mobileMenuOpen ? 'is-open' : ''}`} aria-hidden={!mobileMenuOpen}>
      <nav className="navbar_mobile_nav">
        {navLinks.map((item) => (
          <Link key={item.to} to={item.to} className="navbar_mobile_link" onClick={closeMobileMenu}>
            {item.label}
          </Link>
        ))}
      </nav>

      <form className="navbar_mobile_search" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Tìm khách sạn hoặc địa danh..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <IconButton type="submit" aria-label="Tìm kiếm">
          <Search sx={{ color: '#ffffff' }} />
        </IconButton>
      </form>

      {!user && (
        <div className="navbar_mobile_auth">
          <Link to="/register" className="navbar_mobile_auth_link" onClick={closeMobileMenu}>
            Đăng ký
          </Link>
          <Link
            to="/login"
            state={{ from: routerLocation }}
            className="navbar_mobile_auth_link navbar_mobile_auth_link--primary"
            onClick={closeMobileMenu}
          >
            Đăng nhập
          </Link>
        </div>
      )}
    </div>
    </>
  )
}

export default Navbar;

