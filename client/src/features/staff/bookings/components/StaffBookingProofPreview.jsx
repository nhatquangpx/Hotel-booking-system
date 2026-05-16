import { useEffect, useRef } from 'react';

const DIALOG_LABEL = 'Xem minh chứng chuyển khoản';

const StaffBookingProofPreview = ({ url, onClose }) => {
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  useEffect(() => {
    if (!url) return undefined;

    previousFocusRef.current = document.activeElement;
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (typeof previousFocusRef.current?.focus === 'function') {
        previousFocusRef.current.focus();
      }
    };
  }, [url, onClose]);

  if (!url) return null;

  return (
    <div
      className="proof-preview-overlay"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="proof-preview-modal"
        role="dialog"
        aria-modal="true"
        aria-label={DIALOG_LABEL}
        onClick={(e) => e.stopPropagation()}
      >
        <img src={url} alt={DIALOG_LABEL} />
        <button
          ref={closeButtonRef}
          type="button"
          className="close-proof-btn"
          onClick={onClose}
        >
          Đóng
        </button>
      </div>
    </div>
  );
};

export default StaffBookingProofPreview;
