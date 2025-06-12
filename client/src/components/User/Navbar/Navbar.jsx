import { IconButton, MenuItem, Select, FormControl, InputLabel } from "@mui/material"
import { useState } from 'react'
import { Search, Person, Menu } from "@mui/icons-material"
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from 'react-router-dom'
import { setLogout } from '../../../redux/state'
import "./Navbar.scss"

const pinkred = '#fa002a';
const darkgrey = '#969393';

export const Navbar = () => {
  const [dropdownMenu, setDropdownMenu] = useState(false);
  const [searchType, setSearchType] = useState('hotel');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const userState = useSelector((state) => state.user || {}); 
  const user = userState?.user || null; 

  const dispatch = useDispatch();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Tìm kiếm đồng thời theo tên khách sạn và địa danh
    navigate(`/hotels?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className='navbar'>
      <a href="/">
        <img src="/assets/logo_black_vertical.png" alt="logo" />
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
          <Search sx={{ color: pinkred }} />
        </IconButton>
      </form>

      <div className='navbar_right'>
        <button className='navbar_right_account' onClick={() => setDropdownMenu(!dropdownMenu)}>
          <Menu sx={{ color: darkgrey }} />
          {!user ? (
            <Person sx={{ color: darkgrey }} />
          ) : (
            <img
              src= "/assets/default-profile.jpg"
              alt="profile"
              style={{ objectFit: "cover", borderRadius: "50%" }}
            />
          )}
        </button>

        {dropdownMenu && !user && (
          <div className="navbar_right_accountmenu">
            <Link to="/login">Đăng nhập</Link>
            <Link to="/register">Đăng ký</Link>
          </div>
        )}

        {dropdownMenu && user && (
          <div className="navbar_right_accountmenu">
            <Link to="/my-bookings">Đặt phòng của tôi</Link>
            <Link to={`/profile/${user.id}`}>Thông tin cá nhân</Link>
            <Link to="/login" onClick={() => dispatch(setLogout())}>Đăng xuất</Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Navbar;