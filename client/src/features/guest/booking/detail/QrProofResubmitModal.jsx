import { useEffect, useState } from 'react';
import api from '@/apis';

const QrProofResubmitModal = ({ show, booking, onClose, onSuccess, onError }) => {
  const [proofImage, setProofImage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!show) {
      setProofImage(null);
      setSubmitting(false);
    }
  }, [show, booking?._id]);

  if (!show || !booking) return null;

  const handleSubmit = async () => {
    if (!proofImage) {
      onError?.('Vui lòng chọn ảnh minh chứng chuyển khoản.');
      return;
    }

    try {
      setSubmitting(true);
      onError?.(null);
      const res = await api.payment.confirmQrPayment({
        bookingId: booking._id,
        proofImage,
      });
      onSuccess?.({
        qrPaymentReportedAt: res.qrPaymentReportedAt || new Date().toISOString(),
        qrPaymentProofUrl: res.qrPaymentProofUrl,
        ownerPaymentRejectionReason: undefined,
        ownerQrRejectionType: undefined,
      });
      onClose?.();
    } catch (err) {
      const msg = typeof err === 'string' ? err : err?.message || 'Không thể gửi minh chứng';
      onError?.(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="cancel-modal-overlay" onClick={onClose}>
      <div className="cancel-modal qr-resubmit-modal" onClick={(e) => e.stopPropagation()}>
        <h2>Tải lại minh chứng thanh toán</h2>
        <p>
          Khách sạn yêu cầu bạn gửi lại ảnh minh chứng chuyển khoản hợp lệ cho đơn{' '}
          <strong>#BK{(booking._id || '').slice(-8).toUpperCase()}</strong>.
        </p>
        <div className="qr-resubmit-modal__reason">
          <strong>Lý do:</strong>
          <p>{booking.ownerPaymentRejectionReason || 'Minh chứng không hợp lệ'}</p>
        </div>
        <div className="form-group">
          <label htmlFor="qr-resubmit-proof">Ảnh minh chứng mới *</label>
          <input
            id="qr-resubmit-proof"
            type="file"
            accept="image/*"
            onChange={(e) => setProofImage(e.target.files?.[0] || null)}
          />
          {proofImage && <p className="qr-resubmit-modal__file-name">{proofImage.name}</p>}
        </div>
        <div className="modal-actions">
          <button type="button" className="cancel-btn" onClick={onClose} disabled={submitting}>
            Đóng
          </button>
          <button type="button" className="confirm-btn" onClick={handleSubmit} disabled={submitting || !proofImage}>
            {submitting ? 'Đang gửi...' : 'Gửi minh chứng'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrProofResubmitModal;
