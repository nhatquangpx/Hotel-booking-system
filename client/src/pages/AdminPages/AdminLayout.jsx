import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setLogout } from '../../redux/state';
import './AdminLayout.scss';

const AdminLayout = ({ children }) => {
  const location = useLocation();
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogout = () => {
    dispatch(setLogout());
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Hotel Admin</h2>
        </div>
        <nav className="sidebar-nav">
          <ul>
            <li>
              <Link 
                to="/admin" 
                className={location.pathname === '/admin' ? 'active' : ''}
              >
                Dashboard
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/users" 
                className={location.pathname.includes('/admin/users') ? 'active' : ''}
              >
                Quản lý người dùng
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/rooms" 
                className={location.pathname.includes('/admin/rooms') ? 'active' : ''}
              >
                Quản lý phòng
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/bookings" 
                className={location.pathname.includes('/admin/bookings') ? 'active' : ''}
              >
                Quản lý đặt phòng
              </Link>
            </li>
            <li>
              <button onClick={handleLogout} className="logout-button">
                Đăng xuất
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="content">
        <header className="content-header">
          <h1>
            {location.pathname === '/admin' && 'Dashboard'}
            {location.pathname.includes('/admin/users') && 'Quản lý người dùng'}
            {location.pathname.includes('/admin/rooms') && 'Quản lý phòng'}
            {location.pathname.includes('/admin/bookings') && 'Quản lý đặt phòng'}
          </h1>
        </header>
        <div className="content-body">
          {children}
        </div>
      </main>
    </div>
  );
};

export default AdminLayout; 