import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { toast } from 'react-toastify';
import { AccountCircle, Edit, Lock } from '@mui/icons-material';
import { ROUTES } from '@/constants/routes';
import ProfileLayout from '../components/ProfileLayout';
import api from '../../../../apis';
import '../account/Account.scss';

const ID_NUMBER_PATTERN = /^\d{9}$|^\d{12}$/;

/**
 * Guest Profile Edit — CCCD bắt buộc đủ số + 2 mặt; ảnh cũ được giữ nếu không chọn lại.
 */
const GuestProfileEditPage = () => {
  const user = useSelector((state) => state.user.user);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    idNumber: '',
  });
  const [idImageFrontFile, setIdImageFrontFile] = useState(null);
  const [idImageBackFile, setIdImageBackFile] = useState(null);
  const [hasIdImageFront, setHasIdImageFront] = useState(false);
  const [hasIdImageBack, setHasIdImageBack] = useState(false);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;

      try {
        const data = await api.user.getUserProfile();
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          idNumber: data.idNumber || '',
        });
        setHasIdImageFront(Boolean(data.hasIdImageFront || data.idImageFrontUrl));
        setHasIdImageBack(Boolean(data.hasIdImageBack || data.idImageBackUrl));
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
    if (name === 'idNumber') {
      setFormData((prev) => ({
        ...prev,
        idNumber: value.replace(/[^\d]/g, '').slice(0, 12),
      }));
      return;
    }
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const idDigits = String(formData.idNumber || '').replace(/\s+/g, '').trim();
    if (!ID_NUMBER_PATTERN.test(idDigits)) {
      toast.error('Vui lòng nhập số CCCD/CMND hợp lệ (9 hoặc 12 chữ số)');
      setLoading(false);
      return;
    }

    const willHaveFront = Boolean(idImageFrontFile || hasIdImageFront);
    const willHaveBack = Boolean(idImageBackFile || hasIdImageBack);
    if (!willHaveFront || !willHaveBack) {
      toast.error('Vui lòng tải đủ ảnh CCCD mặt trước và mặt sau');
      setLoading(false);
      return;
    }

    try {
      await api.user.updateUserProfile(
        {
          name: formData.name,
          phone: formData.phone,
          idNumber: idDigits,
        },
        { front: idImageFrontFile, back: idImageBackFile }
      );
      toast.success('Cập nhật thông tin thành công!');
      navigate(ROUTES.PROFILE);
    } catch (error) {
      toast.error(error?.message || 'Có lỗi xảy ra khi cập nhật thông tin!');
      console.error('Error updating user info:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Vui lòng đăng nhập để chỉnh sửa thông tin</div>;
  }

  if (initialLoading) {
    return (
      <ProfileLayout>
        <div style={{ height: '100px' }} />
        <div className="account-container">
          <p>Đang tải...</p>
        </div>
      </ProfileLayout>
    );
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
            <Link to={ROUTES.PROFILE} className="menu-item">
              <AccountCircle sx={{ fontSize: 20, marginRight: 1 }} />
              Thông tin cá nhân
            </Link>
            <Link to={ROUTES.PROFILE_EDIT} className="menu-item active">
              <Edit sx={{ fontSize: 20, marginRight: 1 }} />
              Chỉnh sửa thông tin
            </Link>
            <Link to={ROUTES.PROFILE_CHANGE_PASSWORD} className="menu-item">
              <Lock sx={{ fontSize: 20, marginRight: 1 }} />
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
                  <input type="email" value={user.email} disabled />
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

                <h2>Căn cước công dân</h2>
                <p className="field-hint" style={{ marginBottom: '1rem' }}>
                  Bắt buộc đủ số CCCD và ảnh 2 mặt. Ảnh đã có sẽ được giữ nếu bạn không chọn lại.
                </p>
                <div className="form-group">
                  <label htmlFor="idNumber">
                    Số CCCD/CMND <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="idNumber"
                    type="text"
                    name="idNumber"
                    inputMode="numeric"
                    maxLength={12}
                    value={formData.idNumber}
                    onChange={handleChange}
                    placeholder="9 hoặc 12 chữ số"
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="idImageFront">
                    Ảnh mặt trước <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="idImageFront"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => setIdImageFrontFile(e.target.files?.[0] || null)}
                  />
                  {hasIdImageFront && !idImageFrontFile && (
                    <p className="field-hint">Đã có ảnh mặt trước — chọn file mới nếu muốn thay</p>
                  )}
                </div>
                <div className="form-group">
                  <label htmlFor="idImageBack">
                    Ảnh mặt sau <span aria-hidden="true">*</span>
                  </label>
                  <input
                    id="idImageBack"
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={(e) => setIdImageBackFile(e.target.files?.[0] || null)}
                  />
                  {hasIdImageBack && !idImageBackFile && (
                    <p className="field-hint">Đã có ảnh mặt sau — chọn file mới nếu muốn thay</p>
                  )}
                </div>
              </div>
              <div className="button-group">
                <button type="submit" className="primary" disabled={loading}>
                  {loading ? 'Đang cập nhật...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => navigate(ROUTES.PROFILE)}
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
