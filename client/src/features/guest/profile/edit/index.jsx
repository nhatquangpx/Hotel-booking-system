import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import ProfileLayout from '../components/ProfileLayout';
import api from '../../../../apis';
import '../account/Account.scss';

/**
 * Guest Profile Edit page feature
 * Edit user profile information
 */
const GuestProfileEditPage = () => {
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
        const data = await api.user.getUserProfile(user.id);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
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
      const response = await api.user.updateUserProfile(user.id, formData);
      toast.success('Cập nhật thông tin thành công!');
      navigate(`/profile/${user.id}`);
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật thông tin!');
      console.error('Error updating user info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Vui lòng đăng nhập để chỉnh sửa thông tin</div>;
  }

  return (
    <ProfileLayout>
      <div style={{ height: '100px' }}></div>
      <div className="account-container">
        <div className="account-header">
          <h1>Chỉnh sửa thông tin</h1>
          <p>Cập nhật thông tin cá nhân của bạn</p>
        </div>

        <div className="account-content">
          <div className="sidebar">
            <Link 
              to={`/profile/${user.id}`} 
              className="menu-item"
            >
              <i className="fas fa-user"></i>
              Thông tin cá nhân
            </Link>
            <Link 
              to={`/profile/${user.id}/edit`} 
              className="menu-item active"
            >
              <i className="fas fa-edit"></i>
              Chỉnh sửa thông tin
            </Link>
            <Link 
              to={`/profile/${user.id}/changepassword`} 
              className="menu-item"
            >
              <i className="fas fa-lock"></i>
              Đổi mật khẩu
            </Link>
          </div>

          <div className="main-content">
            <form onSubmit={handleSubmit}>
              <div className="section">
                <h2>Thông tin cá nhân</h2>
                <div className="form-group">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={user.email}
                    disabled
                  />
                </div>
                <div className="form-group">
                  <label>Số điện thoại</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    pattern="[0-9]{10}"
                    title="Vui lòng nhập số điện thoại hợp lệ (10 chữ số)"
                  />
                </div>
              </div>
              <div className="button-group">
                <button type="submit" className="primary" disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
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

export default GuestProfileEditPage;

