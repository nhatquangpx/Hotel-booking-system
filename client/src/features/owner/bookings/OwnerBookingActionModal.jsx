import { formatDate, formatDateTime, formatCurrency } from '@/shared/utils';
import { getImageUrl } from '@/constants/images';
import { QR_REJECTION_OPTIONS } from './qrPaymentRejection';
import { getOverstayDays, isOverstayCheckout } from '@/shared/utils/booking/checkInOut';

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
  lateCheckoutFeeAmount = '',
  onLateCheckoutFeeAmountChange = null,
  lateCheckoutFeeNote = '',
  onLateCheckoutFeeNoteChange = null,
  lateCheckoutOfflineConfirmed = false,
  onLateCheckoutOfflineConfirmedChange = null,
  refundProofFile = null,
  onRefundProofChange = null,
  showRejectionTypeSelect = false,
  rejectionType = '',
  onRejectionTypeChange = null,
}) => {
  if (!show || !booking) return null;

  const selectedOption = QR_REJECTION_OPTIONS.find((opt) => opt.value === rejectionType);
  const overstay = showCheckedInAt && isOverstayCheckout(booking);
  const overstayDays = overstay ? getOverstayDays(booking) : 0;
  const parsedLateFee = Number(String(lateCheckoutFeeAmount).replace(/[^\d]/g, ''));
  const lateFeeValid = overstay ? Number.isFinite(parsedLateFee) && parsedLateFee > 0 : true;
  const lateCheckoutReady = !overstay || (lateFeeValid && lateCheckoutOfflineConfirmed);
  const lateCheckoutDisableReason = overstay
    ? !lateFeeValid
      ? 'Nhập số tiền phụ thu đã thu trực tiếp (lớn hơn 0)'
      : !lateCheckoutOfflineConfirmed
        ? 'Xác nhận đã thu phụ thu trực tiếp từ khách'
        : ''
    : '';
  const mergedDisableConfirm = disableConfirm || (overstay && !lateCheckoutReady);
  const mergedDisableReason = disableReason || lateCheckoutDisableReason;

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

        {overstay && (
          <div className="modal-late-checkout-block">
            <p className="modal-late-checkout-block__title">Checkout quá hạn</p>
            <p className="modal-late-checkout-block__hint">
              Khách đã quá <strong>{overstayDays} ngày</strong> so với ngày trả phòng đã đặt (
              {formatDate(booking.checkOutDate)}). Ghi nhận phụ thu đã thu <strong>trực tiếp tại khách sạn</strong> —
              không qua hệ thống thanh toán.
            </p>
            <label className="late-checkout-field" htmlFor="late-checkout-fee">
              Số tiền phụ thu đã thu (VNĐ) *
            </label>
            <input
              id="late-checkout-fee"
              type="text"
              inputMode="numeric"
              className="late-checkout-input"
              placeholder="Ví dụ: 500000"
              value={lateCheckoutFeeAmount}
              onChange={(e) => onLateCheckoutFeeAmountChange?.(e.target.value)}
            />
            {lateFeeValid && parsedLateFee > 0 && (
              <p className="late-checkout-fee-preview">{formatCurrency(parsedLateFee)}</p>
            )}
            <label className="late-checkout-field" htmlFor="late-checkout-note">
              Ghi chú (tùy chọn)
            </label>
            <textarea
              id="late-checkout-note"
              className="late-checkout-textarea"
              rows={2}
              placeholder="Ví dụ: 1 đêm phụ, thu tiền mặt"
              value={lateCheckoutFeeNote}
              onChange={(e) => onLateCheckoutFeeNoteChange?.(e.target.value)}
            />
            <label className="late-checkout-confirm">
              <input
                type="checkbox"
                checked={lateCheckoutOfflineConfirmed}
                onChange={(e) => onLateCheckoutOfflineConfirmedChange?.(e.target.checked)}
              />
              <span>Đã thu phụ thu trực tiếp từ khách (không qua hệ thống)</span>
            </label>
          </div>
        )}

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

        {showRejectionTypeSelect && (
          <div className="modal-rejection-reason-block">
            <p className="rejection-reason-label">Chọn lý do (bắt buộc):</p>
            <div className="rejection-type-options">
              {QR_REJECTION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`rejection-type-option ${rejectionType === option.value ? 'selected' : ''}`}
                >
                  <input
                    type="radio"
                    name="qr-rejection-type"
                    value={option.value}
                    checked={rejectionType === option.value}
                    onChange={() => onRejectionTypeChange?.(option.value)}
                  />
                  <span className="rejection-type-option__content">
                    <strong>{option.label}</strong>
                    <span>{option.description}</span>
                  </span>
                </label>
              ))}
            </div>
            {selectedOption && (
              <p className="rejection-reason-hint">
                Khách sẽ nhận thông báo và email với lý do: <strong>{selectedOption.label}</strong>.
              </p>
            )}
          </div>
        )}

        <div className="modal-actions">
          <span className="modal-btn-tooltip-wrapper" title={mergedDisableReason}>
            <button
              className="modal-btn confirm-btn"
              onClick={onConfirm}
              disabled={processing || mergedDisableConfirm}
              title={mergedDisableReason}
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
