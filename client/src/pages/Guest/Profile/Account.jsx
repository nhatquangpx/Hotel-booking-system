import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProfileLayout from '../../../components/User/ProfileLayout/ProfileLayout';
import { userAPI } from '../../../apis';
import './Account.scss';

const Account = () => {
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const data = await userAPI.getUserProfile(user.id);
        setUserData(data);
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

  if (loading) {
    return <div>Đang tải thông tin...</div>;
  }

  return (
    <ProfileLayout>
      <div className="account-container">
        <div className="account-header">
          <h1>Tài khoản của tôi</h1>
          <p>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>

        <div className="account-content">
          <div className="sidebar">
            <Link 
              to={`/profile/${user.id}`} 
              className={`menu-item ${location.pathname === `/profile/${user.id}` ? 'active' : ''}`}
            >
              <i className="fas fa-user"></i>
              Thông tin cá nhân
            </Link>
            <Link 
              to={`/profile/${user.id}/edit`} 
              className={`menu-item ${location.pathname === `/profile/${user.id}/edit` ? 'active' : ''}`}
            >
              <i className="fas fa-edit"></i>
              Chỉnh sửa thông tin
            </Link>
            <Link 
              to={`/profile/${user.id}/changepassword`} 
              className={`menu-item ${location.pathname === `/profile/${user.id}/changepassword` ? 'active' : ''}`}
            >
              <i className="fas fa-lock"></i>
              Đổi mật khẩu
            </Link>
          </div>

          <div className="main-content">
            <div className="section">
              <h2>Thông tin cá nhân</h2>
              <div className="form-group">
                <label>Họ và tên</label>
                <input type="text" value={userData?.name || user.name} disabled />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input type="email" value={userData?.email || user.email} disabled />
              </div>
              <div className="form-group">
                <label>Số điện thoại</label>
                <input type="tel" value={userData?.phone || 'Chưa cập nhật'} disabled />
              </div>
              <div className="form-group">
                <label>Địa chỉ</label>
                <input type="text" value={userData?.address || 'Chưa cập nhật'} disabled />
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default Account;
