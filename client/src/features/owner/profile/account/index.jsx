import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AccountCircle, Edit, Lock } from '@mui/icons-material';
import { OwnerLayout } from '@/features/owner/components';
import api from '../../../../apis';
import './Account.scss';

/**
 * Owner Profile Account page feature
 * Display owner account information
 */
const OwnerProfileAccountPage = () => {
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
        const data = await api.ownerProfile.getProfile();
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
    return (
      <OwnerLayout>
        <div>Vui lòng đăng nhập để xem thông tin tài khoản</div>
      </OwnerLayout>
    );
  }

  const basePath = '/owner/profile';

  return (
    <OwnerLayout>
      <div className="owner-profile-container">
        <div className="profile-header">
          <h1>Thông tin tài khoản</h1>
          <p>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>

        <div className="profile-content">
          <div className="sidebar">
            <Link 
              to={basePath} 
              className={`menu-item ${location.pathname === basePath ? 'active' : ''}`}
            >
              <AccountCircle sx={{ fontSize: 20, marginRight: 1 }} />
              Thông tin cá nhân
            </Link>
            <Link 
              to={`${basePath}/edit`} 
              className={`menu-item ${location.pathname === `${basePath}/edit` ? 'active' : ''}`}
            >
              <Edit sx={{ fontSize: 20, marginRight: 1 }} />
              Chỉnh sửa thông tin
            </Link>
            <Link 
              to={`${basePath}/changepassword`} 
              className={`menu-item ${location.pathname === `${basePath}/changepassword` ? 'active' : ''}`}
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
              <div className="form-group">
                <label>Vai trò</label>
                <input 
                  type="text" 
                  value="Chủ khách sạn" 
                  disabled 
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </OwnerLayout>
  );
};

export default OwnerProfileAccountPage;
