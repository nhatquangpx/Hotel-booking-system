import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { toast } from 'react-toastify';
import { AccountCircle, Edit, Lock } from '@mui/icons-material';
import StaffLayout from '@/features/staff/components/StaffLayout';
import { setUser } from '@/store/slices/userSlice';
import api from '@/apis';
import '../account/Account.scss';

const BASE_PATH = '/staff/profile';

const StaffProfileEditPage = () => {
  const user = useSelector((state) => state.user.user);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const data = await api.staffProfile.getProfile();
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
        });
      } catch (error) {
        toast.error('Không thể tải thông tin người dùng!');
        console.error('Error fetching user data:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const updated = await api.staffProfile.updateProfile(formData);
      toast.success('Cập nhật thông tin thành công!');
      if (updated) {
        dispatch(setUser(updated));
      }
      navigate(BASE_PATH);
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật thông tin!');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <StaffLayout>
        <div>Vui lòng đăng nhập để thực hiện chức năng này</div>
      </StaffLayout>
    );
  }

  if (initialLoading) {
    return (
      <StaffLayout>
        <div>Đang tải...</div>
      </StaffLayout>
    );
  }

  return (
    <StaffLayout>
      <div className="staff-profile-container">
        <div className="profile-header">
          <h1>Chỉnh sửa thông tin</h1>
          <p>Cập nhật thông tin cá nhân của bạn</p>
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
            <form onSubmit={handleSubmit} className="edit-form">
              <div className="section">
                <h2>Thông tin cá nhân</h2>
                <div className="form-group">
                  <label htmlFor="name">Họ và tên</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="phone">Số điện thoại</label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
                  </button>
                  <Link to={BASE_PATH} className="btn-secondary">
                    Hủy
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffProfileEditPage;
