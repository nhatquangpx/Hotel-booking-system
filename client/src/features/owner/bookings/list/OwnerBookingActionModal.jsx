import { formatDate, formatDateTime } from '@/shared/utils';
import { getImageUrl } from '@/constants/images';

const OwnerBookingActionModal = ({
  show,
  title,
  prompt,
  booking,
  processing,
  confirmText,
  onConfirm,
  onClose,
  onPreviewProof,
  showQrProofDetails = false,
  qrProofMissing = false,
  disableConfirm = false,
  disableReason = '',
  showCheckedInAt = false,
  showRefundProofUpload = false,
  refundProofFile = null,
  onRefundProofChange = null,
}) => {
  if (!show || !booking) return null;

  return (
    <div className="confirmation-modal-overlay" onClick={onClose}>
      <div className="confirmation-modal" onClick={(e) => e.stopPropagation()}>
        <h3>{title}</h3>
        <p>
          {prompt}{' '}
          <strong>{booking.guest?.name || 'N/A'}</strong>?
        </p>
        <div className="modal-booking-info">
          <div className="info-row">
            <span className="info-label">Phòng:</span>
            <span className="info-value">
              <strong>{booking.room?.roomNumber || 'N/A'}</strong>
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Ngày nhận:</span>
            <span className="info-value">
              <strong>{formatDate(booking.checkInDate)}</strong>
            </span>
          </div>
          <div className="info-row">
            <span className="info-label">Ngày trả:</span>
            <span className="info-value">
              <strong>{formatDate(booking.checkOutDate)}</strong>
            </span>
          </div>

          {showQrProofDetails && booking.paymentMethod === 'qr_code' && booking.qrPaymentReportedAt && (
            <>
              <div className="info-row">
                <span className="info-label">Khách báo chuyển khoản:</span>
                <span className="info-value">
                  <strong>{formatDateTime(booking.qrPaymentReportedAt)}</strong>
                </span>
              </div>
              {booking.qrPaymentProofUrl && (
                <div className="info-row">
                  <span className="info-label">Ảnh minh chứng:</span>
                  <span className="info-value">
                    <button
                      type="button"
                      className="proof-link"
                      onClick={() => onPreviewProof(getImageUrl(booking.qrPaymentProofUrl))}
                    >
                      Mở ảnh minh chứng
                    </button>
                  </span>
                </div>
              )}
            </>
          )}

          {showCheckedInAt && booking.checkedInAt && (
            <div className="info-row">
              <span className="info-label">Đã check-in:</span>
              <span className="info-value">
                <strong>{formatDateTime(booking.checkedInAt)}</strong>
              </span>
            </div>
          )}
        </div>

        {(booking.guestRefundBankAccountName ||
          booking.guestRefundBankAccountNumber ||
          booking.guestRefundBankName) && (
          <div className="modal-booking-info">
            <div className="info-row">
              <span className="info-label">Nhận hoàn (khách cung cấp):</span>
              <span className="info-value">
                <strong>
                  {[booking.guestRefundBankAccountName, booking.guestRefundBankAccountNumber, booking.guestRefundBankName]
                    .filter(Boolean)
                    .join(' — ')}
                </strong>
              </span>
            </div>
          </div>
        )}

        {qrProofMissing && (
          <p className="modal-inline-error">
            Đơn QR chưa có minh chứng chuyển khoản, chưa thể xác nhận đã thanh toán.
          </p>
        )}

        {showRefundProofUpload && (
          <div className="modal-refund-proof-block">
            <label className="refund-proof-label">Minh chứng hoàn tiền:</label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => onRefundProofChange?.(e.target.files?.[0] || null)}
            />
            <p className="refund-proof-hint">
              {refundProofFile
                ? `Đã chọn: ${refundProofFile.name}`
                : 'Bắt buộc tải ảnh minh chứng trước khi xác nhận hoàn tiền.'}
            </p>
          </div>
        )}

        <div className="modal-actions">
          <span className="modal-btn-tooltip-wrapper" title={disableReason}>
            <button
              className="modal-btn confirm-btn"
              onClick={onConfirm}
              disabled={processing || disableConfirm}
              title={disableReason}
            >
              {processing ? 'Đang xử lý...' : confirmText}
            </button>
          </span>
          <button className="modal-btn cancel-btn" onClick={onClose} disabled={processing}>
            Hủy
          </button>
        </div>
      </div>
    </div>
  );
};

export default OwnerBookingActionModal;

