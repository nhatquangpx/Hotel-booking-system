import './LoginRequiredModal.scss';

const DEFAULT_TITLE = 'Cần đăng nhập';
const DEFAULT_MESSAGE =
  'Bạn cần đăng nhập tài khoản trước khi tiếp tục. Vui lòng đăng nhập để tiếp tục.';

/**
 * Modal yêu cầu đăng nhập — dùng chung (trang chủ, chi tiết khách sạn, …).
 */
export const LoginRequiredModal = ({
  open,
  onClose,
  onLogin,
  title = DEFAULT_TITLE,
  message = DEFAULT_MESSAGE,
}) => {
  if (!open) return null;

  return (
    <div
      className="login-required-modal-overlay"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="login-required-modal"
        role="dialog"
        aria-labelledby="login-required-modal-title"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="login-required-modal-title">{title}</h3>
        <p>{message}</p>
        <div className="login-required-modal__actions">
          <button
            type="button"
            className="login-required-modal__btn login-required-modal__btn--primary"
            onClick={onLogin}
          >
            Đăng nhập
          </button>
          <button
            type="button"
            className="login-required-modal__btn login-required-modal__btn--secondary"
            onClick={onClose}
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoginRequiredModal;
