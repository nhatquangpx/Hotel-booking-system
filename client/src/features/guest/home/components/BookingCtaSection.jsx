import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/hooks';
import './BookingCtaSection.scss';

/**
 * CTA cuối trang chủ — khuyến khích khách bắt đầu đặt phòng
 */
export const BookingCtaSection = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      setShowLoginModal(false);
    }
  }, [isAuthenticated]);

  const handleStartBooking = () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    navigate('/hotels');
  };

  const handleGoLogin = () => {
    setShowLoginModal(false);
    navigate('/login', { state: { from: '/hotels' } });
  };

  return (
    <>
      <section className="booking-cta-section" aria-labelledby="booking-cta-heading">
        <div className="booking-cta-section__inner">
          <h2 id="booking-cta-heading">Sẵn sàng cho chuyến đi tiếp theo?</h2>
          <p className="booking-cta-section__desc">
            Khám phá hàng trăm khách sạn, so sánh giá và đặt phòng chỉ trong vài phút.
          </p>
          <div className="booking-cta-section__actions">
            <button
              type="button"
              className="booking-cta-section__btn booking-cta-section__btn--primary"
              onClick={handleStartBooking}
            >
              Bắt đầu đặt phòng
            </button>
            {isAuthenticated ? (
              <button
                type="button"
                className="booking-cta-section__btn booking-cta-section__btn--secondary"
                onClick={() => navigate('/my-bookings')}
              >
                Đơn của tôi
              </button>
            ) : (
              <button
                type="button"
                className="booking-cta-section__btn booking-cta-section__btn--secondary"
                onClick={() => navigate('/contact')}
              >
                Liên hệ hỗ trợ
              </button>
            )}
          </div>
        </div>
      </section>

      {showLoginModal && (
        <div
          className="booking-cta-login-modal-overlay"
          role="presentation"
          onClick={() => setShowLoginModal(false)}
        >
          <div
            className="booking-cta-login-modal"
            role="dialog"
            aria-labelledby="booking-cta-login-title"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="booking-cta-login-title">Cần đăng nhập</h3>
            <p>
              Bạn cần đăng nhập tài khoản trước khi đặt phòng. Vui lòng đăng nhập để tiếp tục.
            </p>
            <div className="booking-cta-login-modal__actions">
              <button
                type="button"
                className="booking-cta-section__btn booking-cta-section__btn--primary"
                onClick={handleGoLogin}
              >
                Đăng nhập
              </button>
              <button
                type="button"
                className="booking-cta-section__btn booking-cta-section__btn--secondary"
                onClick={() => setShowLoginModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
