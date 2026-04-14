import { IconButton } from "@mui/material"
import { useState, useEffect, useRef } from 'react'
import { Search, Hotel, Favorite, AccountCircle, Logout, KeyboardArrowDown } from "@mui/icons-material"
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from 'react-router-dom'
import { setLogout } from '@/store/slices/userSlice'
import { IMAGE_PATHS } from '@/constants/images'
import { NotificationBell } from '@/features/notifications'
import "./Navbar.scss"

export const Navbar = () => {
  const [dropdownMenu, setDropdownMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
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

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    navigate(`/hotels?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className='navbar'>
      <a href="/">
        <img src={IMAGE_PATHS.LOGO_VERTICAL_WHITE} alt="logo" />
      </a>

      <div className='navbar_menu'>
        <Link to="/" className="menu-item">Trang chủ</Link>
        <Link to="/hotels" className="menu-item">Khách sạn</Link>
        <Link to="/about" className="menu-item">Giới thiệu</Link>
        <Link to="/contact" className="menu-item">Liên hệ</Link>
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
            <Link to="/login" className="navbar_auth_button navbar_auth_button_login">
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
                {user.role === 'guest' && (
                  <Link to="/wishlist" onClick={() => setDropdownMenu(false)}>
                    <Favorite sx={{ fontSize: 20, marginRight: 1 }} />
                    Danh sách yêu thích
                  </Link>
                )}
                <Link to={`/profile/${user.id}`} onClick={() => setDropdownMenu(false)}>
                  <AccountCircle sx={{ fontSize: 20, marginRight: 1 }} />
                  Thông tin cá nhân
                </Link>
                <Link to="/login" onClick={() => {
                  dispatch(setLogout());
                  setDropdownMenu(false);
                }}>
                  <Logout sx={{ fontSize: 20, marginRight: 1 }} />
                  Đăng xuất
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar;

