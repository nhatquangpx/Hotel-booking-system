import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AccountCircle, Edit, Lock } from '@mui/icons-material';
import { OwnerLayout } from '@/features/owner/components';
import api from '../../../../apis';
import '../account/Account.scss';

/**
 * Owner Profile Change Password page feature
 * Change owner password
 */
const OwnerProfileChangePasswordPage = () => {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();
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
      await api.ownerProfile.changePassword({
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      toast.success('Đổi mật khẩu thành công!');
      navigate('/owner/profile');
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
      <OwnerLayout>
        <div>Vui lòng đăng nhập để thực hiện chức năng này</div>
      </OwnerLayout>
    );
  }

  const basePath = '/owner/profile';

  return (
    <OwnerLayout>
      <div className="owner-profile-container">
        <div className="profile-header">
          <h1>Đổi mật khẩu</h1>
          <p>Thay đổi mật khẩu để bảo vệ tài khoản của bạn</p>
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
              className="menu-item"
            >
              <Edit sx={{ fontSize: 20, marginRight: 1 }} />
              Chỉnh sửa thông tin
            </Link>
            <Link 
              to={`${basePath}/changepassword`} 
              className="menu-item active"
            >
              <Lock sx={{ fontSize: 20, marginRight: 1 }} />
              Đổi mật khẩu
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
    </OwnerLayout>
  );
};

export default OwnerProfileChangePasswordPage;
