import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AccountCircle, Edit, Lock } from '@mui/icons-material';
import StaffLayout from '@/features/staff/components/StaffLayout';
import api from '@/apis';
import './Account.scss';

const BASE_PATH = '/staff/profile';

const StaffProfileAccountPage = () => {
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    assignedHotelId: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const data = await api.staffProfile.getProfile();
        setUserData((prev) => ({ ...prev, ...data }));
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
      <StaffLayout>
        <div>Vui lòng đăng nhập để xem thông tin tài khoản</div>
      </StaffLayout>
    );
  }

  const hotelName = userData.assignedHotelId?.name;

  return (
    <StaffLayout>
      <div className="staff-profile-container">
        <div className="profile-header">
          <h1>Thông tin tài khoản</h1>
          <p>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>

        <div className="profile-content">
          <div className="sidebar">
            <Link
              to={BASE_PATH}
              className={`menu-item ${location.pathname === BASE_PATH ? 'active' : ''}`}
            >
              <AccountCircle sx={{ fontSize: 20, marginRight: 1 }} />
              Thông tin cá nhân
            </Link>
            <Link
              to={`${BASE_PATH}/edit`}
              className={`menu-item ${location.pathname === `${BASE_PATH}/edit` ? 'active' : ''}`}
            >
              <Edit sx={{ fontSize: 20, marginRight: 1 }} />
              Chỉnh sửa thông tin
            </Link>
            <Link
              to={`${BASE_PATH}/changepassword`}
              className={`menu-item ${location.pathname === `${BASE_PATH}/changepassword` ? 'active' : ''}`}
            >
              <Lock sx={{ fontSize: 20, marginRight: 1 }} />
              Đổi mật khẩu
            </Link>
          </div>

          <div className="main-content">
            {loading ? (
              <p>Đang tải...</p>
            ) : (
              <div className="section">
                <h2>Thông tin cá nhân</h2>
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input type="text" value={userData.name} disabled />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input type="email" value={userData.email} disabled />
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
                  <input type="text" value="Nhân viên khách sạn" disabled />
                </div>
                <div className="form-group">
                  <label>Khách sạn được gán</label>
                  <input
                    type="text"
                    value={hotelName || 'Chưa được gán khách sạn'}
                    disabled
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffProfileAccountPage;
