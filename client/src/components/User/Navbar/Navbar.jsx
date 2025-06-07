import { IconButton } from "@mui/material"
import { useState } from 'react'
import { Search, Person, Menu } from "@mui/icons-material"
import { useSelector, useDispatch } from "react-redux";
import { Link } from 'react-router-dom'
import { setLogout } from '../../../redux/state'
import "./Navbar.scss"

const pinkred = '#fa002a';
const darkgrey = '#969393';

export const Navbar = () => {
  const [dropdownMenu, setDropdownMenu] = useState(false)

  const userState = useSelector((state) => state.user || {}); 
  const user = userState?.user || null; 

  const dispatch = useDispatch()

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

      <div className='navbar_search'>
        <input type="text" placeholder='Tìm kiếm ...' />
        <IconButton>
          <Search sx={{ color: pinkred }} />
        </IconButton>
      </div>

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