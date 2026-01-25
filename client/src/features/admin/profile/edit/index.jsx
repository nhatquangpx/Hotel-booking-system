import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { AccountCircle, Edit, Lock } from '@mui/icons-material';
import { AdminLayout } from '@/features/admin/components';
import api from '../../../../apis';
import '../account/Account.scss';

/**
 * Admin Profile Edit page feature
 * Edit admin profile information
 */
const AdminProfileEditPage = () => {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      
      try {
        const data = await api.adminProfile.getProfile();
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await api.adminProfile.updateProfile(formData);
      toast.success('Cập nhật thông tin thành công!');
      navigate('/admin/profile');
    } catch (error) {
      toast.error(error.message || 'Có lỗi xảy ra khi cập nhật thông tin!');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <AdminLayout>
        <div>Vui lòng đăng nhập để thực hiện chức năng này</div>
      </AdminLayout>
    );
  }

  if (initialLoading) {
    return (
      <AdminLayout>
        <div>Đang tải...</div>
      </AdminLayout>
    );
  }

  const basePath = '/admin/profile';

  return (
    <AdminLayout>
      <div className="admin-profile-container">
        <div className="profile-header">
          <h1>Chỉnh sửa thông tin</h1>
          <p>Cập nhật thông tin cá nhân của bạn</p>
        </div>

        <div className="profile-content">
          <div className="sidebar">
            <Link 
              to={basePath} 
              className="menu-item"
            >
              <AccountCircle sx={{ fontSize: 20, marginRight: 1 }} />
              Thông tin cá nhân
            </Link>
            <Link 
              to={`${basePath}/edit`} 
              className="menu-item active"
            >
              <Edit sx={{ fontSize: 20, marginRight: 1 }} />
              Chỉnh sửa thông tin
            </Link>
            <Link 
              to={`${basePath}/changepassword`} 
              className="menu-item"
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
                  <Link to={basePath} className="btn-secondary">
                    Hủy
                  </Link>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminProfileEditPage;
