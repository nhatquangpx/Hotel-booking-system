import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AccountCircle, Edit, Lock } from '@mui/icons-material';
import { ROUTES } from '@/constants/routes';
import ProfileLayout from '../components/ProfileLayout';
import api from '../../../../apis';
import './Account.scss';

/**
 * Guest Profile Account page feature
 * Display user account information
 */
const GuestProfileAccountPage = () => {
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: ''
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const data = await api.user.getUserProfile();
        setUserData(prev => ({
          ...prev,
          ...data
        }));
      } catch (error) {
        toast.error('Không thể tải thông tin người dùng!');
        console.error('Error fetching user data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  if (!user) {
    return <div>Vui lòng đăng nhập để xem thông tin tài khoản</div>;
  }

  return (
    <ProfileLayout>
      <div style={{ height: '100px' }}></div>
      <div className="account-container">
        <div className="account-header">
          <h1>Tài khoản của tôi</h1>
          <p>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>

        <div className="account-content">
          <div className="sidebar">
            <Link 
              to={ROUTES.PROFILE} 
              className={`menu-item ${location.pathname === ROUTES.PROFILE ? 'active' : ''}`}
            >
              <AccountCircle sx={{ fontSize: 20, marginRight: 1 }} />
              Thông tin cá nhân
            </Link>
            <Link 
              to={ROUTES.PROFILE_EDIT} 
              className={`menu-item ${location.pathname === ROUTES.PROFILE_EDIT ? 'active' : ''}`}
            >
              <Edit sx={{ fontSize: 20, marginRight: 1 }} />
              Chỉnh sửa thông tin
            </Link>
            <Link 
              to={ROUTES.PROFILE_CHANGE_PASSWORD} 
              className={`menu-item ${location.pathname === ROUTES.PROFILE_CHANGE_PASSWORD ? 'active' : ''}`}
            >
              <Lock sx={{ fontSize: 20, marginRight: 1 }} />
              Đổi mật khẩu
            </Link>
          </div>

          <div className="main-content">
            <div className="section">
              <h2>Thông tin cá nhân</h2>
              <div className="form-group">
                <label>Họ và tên</label>
                <input 
                  type="text" 
                  value={userData.name} 
                  disabled 
                />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input 
                  type="email" 
                  value={userData.email} 
                  disabled 
                />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input 
                  type="tel" 
                  value={userData.phone || 'Chưa cập nhật'} 
                  disabled 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default GuestProfileAccountPage;
