import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaIdCard, FaTimes } from 'react-icons/fa';
import { useAuth } from '@/shared/hooks';
import api from '@/apis';
import { ROUTES } from '@/constants/routes';
import {
  dismissCccdReminder,
  isCccdReminderDismissed,
} from '@/shared/utils/auth/cccdReminder';
import './CccdReminderBanner.scss';

/**
 * Banner nhắc cập nhật CCCD trên trang chủ — không đè nội dung.
 * Tắt bằng X: ẩn hết phiên đăng nhập hiện tại (sessionStorage + clear khi logout).
 */
export const CccdReminderBanner = () => {
  const { user, isAuthenticated, sessionChecked, role } = useAuth();
  const [visible, setVisible] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    if (!sessionChecked || !isAuthenticated || role !== 'guest' || !user) {
      setVisible(false);
      return undefined;
    }

    const userId = user._id || user.id;
    if (isCccdReminderDismissed(userId)) {
      setVisible(false);
      return undefined;
    }

    let cancelled = false;
    const checkProfile = async () => {
      setChecking(true);
      try {
        const profile = await api.user.getUserProfile();
        if (cancelled) return;
        const idNumber = String(profile?.idNumber || '').replace(/\s+/g, '').trim();
        const complete =
          /^\d{9}$|^\d{12}$/.test(idNumber) &&
          Boolean(profile?.hasIdImageFront || profile?.idImageFrontUrl) &&
          Boolean(profile?.hasIdImageBack || profile?.idImageBackUrl);
        setVisible(!complete);
      } catch {
        if (!cancelled) setVisible(false);
      } finally {
        if (!cancelled) setChecking(false);
      }
    };

    checkProfile();
    return () => {
      cancelled = true;
    };
  }, [sessionChecked, isAuthenticated, role, user]);

  const handleDismiss = () => {
    const userId = user?._id || user?.id;
    dismissCccdReminder(userId);
    setVisible(false);
  };

  if (!visible || checking) return null;

  return (
    <div className="cccd-reminder-banner" role="status">
      <div className="cccd-reminder-banner__inner">
        <FaIdCard className="cccd-reminder-banner__icon" aria-hidden />
        <p className="cccd-reminder-banner__text">
          Bạn chưa cập nhật đủ thông tin CCCD (số + ảnh 2 mặt). Hãy bổ sung trong hồ sơ để đặt phòng và check-in thuận tiện hơn.{' '}
          <Link to={ROUTES.PROFILE_EDIT} className="cccd-reminder-banner__link">
            Cập nhật ngay
          </Link>
        </p>
        <button
          type="button"
          className="cccd-reminder-banner__close"
          onClick={handleDismiss}
          aria-label="Đóng thông báo trong phiên này"
        >
          <FaTimes aria-hidden />
        </button>
      </div>
    </div>
  );
};

export default CccdReminderBanner;
