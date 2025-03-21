import { Icon, IconButton } from "@mui/material"
import { Search, Person, Menu } from "@mui/icons-material"
import variables from "../styles/variables.scss"

export const Navbar = () => {
  return (
    <div className='navbar'>
      <a href="/">
        <img src="/assets/logo_black.png" alt="logo" />
      </a>
      <div className='navbar_search'>
        <input type="text" placeholder='Search ...' />
        <IconButton>
          <Search sx={{ color: variables.pinkred }} />
        </IconButton>
      </div>
      <div className='navbar_right'>
        <button className='navbar_right_account'>
          <Menu sx={{ color: variables.darkgrey }} />
          (!user ? (
          <Person sx={{ color: variables.darkgrey }} />
          : (
          <img src={'http://localhost:8001/${user.profileImagePath.replace("public","")}'} 
          alt="profile photo" 
          style={{ objectFit: "cover", borderRadius: "50%" }} 
          />
          )
        </button>
      </div>
    </div>
  )
}

