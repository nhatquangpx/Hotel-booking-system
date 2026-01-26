import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AccountCircle, Edit, Lock, Security } from '@mui/icons-material';
import { AdminLayout } from '@/features/admin/components';
import api from '../../../../apis';
import '../account/Account.scss';

/**
 * Admin Profile Change Password page feature
 * Change admin password
 */
const AdminProfileChangePasswordPage = () => {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({
      ...prev,
      [name]: ''
    }));
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };

    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
      isValid = false;
    }

    if (!formData.newPassword) {
      newErrors.newPassword = 'Vui lòng nhập mật khẩu mới';
      isValid = false;
    } else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
      isValid = false;
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
      isValid = false;
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await api.adminProfile.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      toast.success('Đổi mật khẩu thành công!');
      navigate('/admin/profile');
    } catch (error) {
      if (error.message?.includes('Mật khẩu hiện tại')) {
        setErrors(prev => ({
          ...prev,
          currentPassword: error.message
        }));
      } else {
        toast.error(error.message || 'Có lỗi xảy ra khi đổi mật khẩu!');
      }
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

  const basePath = '/admin/profile';

  return (
    <AdminLayout>
      <div className="admin-profile-container">
        <div className="profile-header">
          <h1>Đổi mật khẩu</h1>
          <p>Thay đổi mật khẩu để bảo vệ tài khoản của bạn</p>
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
            <Link 
              to={`${basePath}/two-factor`} 
              className={`menu-item ${location.pathname === `${basePath}/two-factor` ? 'active' : ''}`}
            >
              <Security sx={{ fontSize: 20, marginRight: 1 }} />
              Xác thực 2 lớp
            </Link>
          </div>

          <div className="main-content">
            <form onSubmit={handleSubmit} className="change-password-form">
              <div className="section">
                <h2>Thay đổi mật khẩu</h2>
                <div className="form-group">
                  <label htmlFor="currentPassword">Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    id="currentPassword"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    className={errors.currentPassword ? 'error' : ''}
                  />
                  {errors.currentPassword && (
                    <span className="error-message">{errors.currentPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="newPassword">Mật khẩu mới</label>
                  <input
                    type="password"
                    id="newPassword"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    className={errors.newPassword ? 'error' : ''}
                  />
                  {errors.newPassword && (
                    <span className="error-message">{errors.newPassword}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={errors.confirmPassword ? 'error' : ''}
                  />
                  {errors.confirmPassword && (
                    <span className="error-message">{errors.confirmPassword}</span>
                  )}
                </div>

                <div className="form-actions">
                  <button type="submit" className="btn-primary" disabled={loading}>
                    {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
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

export default AdminProfileChangePasswordPage;
