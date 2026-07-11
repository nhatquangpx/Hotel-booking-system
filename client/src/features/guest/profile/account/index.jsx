import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { Link, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AccountCircle, Edit, Lock } from '@mui/icons-material';
import { ROUTES } from '@/constants/routes';
import ProfileLayout from '../components/ProfileLayout';
import api from '../../../../apis';
import './Account.scss';

function useIdSideImage(side, enabled) {
  const [url, setUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!enabled) {
        setUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return null;
        });
        setError(false);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(false);
      try {
        const blob = await api.user.getProfileIdImageBlob(side);
        if (cancelled) return;
        const objectUrl = URL.createObjectURL(blob);
        setUrl((prev) => {
          if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
          return objectUrl;
        });
      } catch {
        if (!cancelled) {
          setError(true);
          setUrl((prev) => {
            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
            return null;
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [side, enabled]);

  useEffect(() => {
    return () => {
      if (url?.startsWith('blob:')) URL.revokeObjectURL(url);
    };
  }, [url]);

  return { url, loading, error };
}

const GuestProfileAccountPage = () => {
  const user = useSelector((state) => state.user.user);
  const location = useLocation();
  const [userData, setUserData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    idNumber: '',
    hasIdImageFront: false,
    hasIdImageBack: false,
  });
  const [loading, setLoading] = useState(true);

  const front = useIdSideImage('front', userData.hasIdImageFront && !loading);
  const back = useIdSideImage('back', userData.hasIdImageBack && !loading);

  useEffect(() => {
    let cancelled = false;

    const fetchUserData = async () => {
      if (!user) return;

      try {
        const data = await api.user.getUserProfile();
        if (cancelled) return;
        setUserData((prev) => ({
          ...prev,
          ...data,
          hasIdImageFront: Boolean(data.hasIdImageFront || data.idImageFrontUrl),
          hasIdImageBack: Boolean(data.hasIdImageBack || data.idImageBackUrl),
        }));
      } catch (error) {
        if (!cancelled) {
          toast.error('Không thể tải thông tin người dùng!');
          console.error('Error fetching user data:', error);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchUserData();
    return () => {
      cancelled = true;
    };
  }, [user]);

  if (!user) {
    return <div>Vui lòng đăng nhập để xem thông tin tài khoản</div>;
  }

  const renderSide = (label, state) => (
    <div className="id-image-side">
      <span className="id-image-side__label">{label}</span>
      <div className="id-image-preview">
        {state.loading && <p className="id-image-preview__status">Đang tải ảnh...</p>}
        {state.error && (
          <p className="id-image-preview__status id-image-preview__status--error">
            Không thể tải ảnh
          </p>
        )}
        {state.url && !state.loading && (
          <img src={state.url} alt={label} className="id-image-preview__img" />
        )}
      </div>
    </div>
  );

  return (
    <ProfileLayout>
      <div style={{ height: '100px' }}></div>
      <div className="account-container">
        <div className="account-header">
          <h1>Tài khoản của tôi</h1>
          <p>Quản lý thông tin cá nhân và bảo mật tài khoản</p>
        </div>

        <div className="account-content">
          <div className="sidebar">
            <Link
              to={ROUTES.PROFILE}
              className={`menu-item ${location.pathname === ROUTES.PROFILE ? 'active' : ''}`}
            >
              <AccountCircle sx={{ fontSize: 20, marginRight: 1 }} />
              Thông tin cá nhân
            </Link>
            <Link
              to={ROUTES.PROFILE_EDIT}
              className={`menu-item ${location.pathname === ROUTES.PROFILE_EDIT ? 'active' : ''}`}
            >
              <Edit sx={{ fontSize: 20, marginRight: 1 }} />
              Chỉnh sửa thông tin
            </Link>
            <Link
              to={ROUTES.PROFILE_CHANGE_PASSWORD}
              className={`menu-item ${location.pathname === ROUTES.PROFILE_CHANGE_PASSWORD ? 'active' : ''}`}
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
                  <input type="tel" value={userData.phone || 'Chưa cập nhật'} disabled />
                </div>
                <div className="form-group">
                  <label>Số CCCD/CMND</label>
                  <input type="text" value={userData.idNumber || 'Chưa cập nhật'} disabled />
                </div>
                <div className="form-group form-group--id-image">
                  <label>Ảnh CCCD</label>
                  {userData.hasIdImageFront || userData.hasIdImageBack ? (
                    <div className="id-image-pair">
                      {userData.hasIdImageFront
                        ? renderSide('Mặt trước', front)
                        : (
                          <div className="id-image-side">
                            <span className="id-image-side__label">Mặt trước</span>
                            <input type="text" value="Chưa cập nhật" disabled />
                          </div>
                        )}
                      {userData.hasIdImageBack
                        ? renderSide('Mặt sau', back)
                        : (
                          <div className="id-image-side">
                            <span className="id-image-side__label">Mặt sau</span>
                            <input type="text" value="Chưa cập nhật" disabled />
                          </div>
                        )}
                    </div>
                  ) : (
                    <input type="text" value="Chưa cập nhật" disabled />
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </ProfileLayout>
  );
};

export default GuestProfileAccountPage;
