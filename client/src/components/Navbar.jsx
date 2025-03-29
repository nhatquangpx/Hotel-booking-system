import { IconButton } from "@mui/material"
import { useState } from 'react'
import { Search, Person, Menu } from "@mui/icons-material"
import { useSelector, useDispatch } from "react-redux";
import variables from "../styles/variables.scss"
import { Link } from 'react-router-dom'
import { setLogout } from '../redux/state'
import "../styles/Homepage/Navbar.scss"

export const Navbar = () => {
  const [dropdownMenu, setDropdownMenu] = useState(false)

  const userState = useSelector((state) => state.user || {}); 
  const user = userState?.user || null; 


  const dispatch = useDispatch()

  return (
    <div className='navbar'>
      <a href="/">
        <img src="/assets/logo_black.png" alt="logo" />
      </a>
      <div className='navbar_search'>
        <input type="text" placeholder='Tìm kiếm ...' />
        <IconButton>
          <Search sx={{ color: variables.pinkred }} />
        </IconButton>
      </div>
      <div className='navbar_right'>
        <button className='navbar_right_account' onClick={() => setDropdownMenu(!dropdownMenu)}>
          <Menu sx={{ color: variables.darkgrey }} />
          {!user ? (
            <Person sx={{ color: variables.darkgrey }} />
          ) : (
            <img
              src={
                user.profileImagePath
                  ? `http://localhost:8001/${user.profileImagePath.replace("public", "")}`
                  : "/assets/default-profile.jpg"
              }
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
            <Link to={`/${user._id}/booking`}>Danh sách đặt phòng</Link>
            <Link to={`/${user._id}/properties`}>Thông tin cá nhân</Link>
            <Link to="/login" onClick={() => dispatch(setLogout())}>Đăng xuất</Link>
          </div>
        )}


      </div>

    </div>
  )
}

export default Navbar;