import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import ProfileLayout from '../../../components/User/ProfileLayout/ProfileLayout';
import { userAPI } from '../../../apis';
import './Account.scss';

const ChangePassword = () => {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [loading, setLoading] = useState(false);

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

    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Mật khẩu mới không khớp!');
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error('Mật khẩu mới phải có ít nhất 6 ký tự!');
      setLoading(false);
      return;
    }

    try {
      await userAPI.changePassword(user.id, {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      
      toast.success('Đổi mật khẩu thành công!');
      navigate(`/profile/${user.id}`);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi đổi mật khẩu!');
      console.error('Error changing password:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Vui lòng đăng nhập để đổi mật khẩu</div>;
  }

  return (
    <ProfileLayout>
      <div className="account-container">
        <div className="account-header">
          <h1>Đổi mật khẩu</h1>
          <p>Cập nhật mật khẩu tài khoản của bạn</p>
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
            <form onSubmit={handleSubmit}>
              <div className="section">
                <h2>Thông tin mật khẩu</h2>
                <div className="form-group">
                  <label>Mật khẩu hiện tại</label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Mật khẩu mới</label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
                <div className="form-group">
                  <label>Xác nhận mật khẩu mới</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    minLength={6}
                  />
                </div>
              </div>

              <div className="button-group">
                <button type="submit" className="primary" disabled={loading}>
                  {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
                <button 
                  type="button" 
                  className="secondary"
                  onClick={() => navigate(`/profile/${user.id}`)}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default ChangePassword;
