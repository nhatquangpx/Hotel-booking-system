import { FaPhone, FaCalendarAlt, FaCreditCard } from 'react-icons/fa';
import { formatDate, formatDateTime, tryOpenCheckIn, tryOpenCheckOut, getOwnerActionLabel, canOwnerReopenBooking } from '@/shared/utils';

const OwnerBookingCard = ({
  booking,
  source,
  highlightAction = false,
  showActionBadge = false,
  onOpenDetail,
  onOpenConfirm,
  onOpenCheckIn,
  onOpenCheckOut,
  onOpenRefund,
  onOpenReject,
  onOpenReopen,
  onPreviewProof,
}) => {
  const guest = booking.guest || {};
  const room = booking.room || {};
  const { paymentStatus } = booking;
  const paymentMethodLabel =
    booking.paymentMethod === 'qr_code'
      ? 'QR chuyển khoản'
      : booking.paymentMethod === 'vnpay'
        ? 'VNPay'
        : 'Không xác định';
  const isCheckedIn = booking.checkedInAt !== null && booking.checkedInAt !== undefined;
  const isCheckedOut = booking.checkedOutAt !== null && booking.checkedOutAt !== undefined;

  const needsOwnerRefundConfirm =
    paymentStatus === 'cancelled' &&
    booking.guestCancelSnapshot?.wasPaid &&
    booking.guestCancelSnapshot?.refundPolicyEligible &&
    booking.guestCancelRequestedAt &&
    !booking.ownerRefundCompletedAt;

  const canReopen = canOwnerReopenBooking(booking);
  const actionLabel = showActionBadge ? getOwnerActionLabel(booking) : null;

  const renderStatusButtons = () => {
    if (isCheckedOut) {
      return (
        <button className="status-btn checked-out" disabled>
          Đã trả phòng
        </button>
      );
    }

    if (isCheckedIn) {
      return (
        <>
          <button className="status-btn checked-in">Đã nhận phòng</button>
          <button
            type="button"
            className="status-btn check-out"
            onClick={() => tryOpenCheckOut(booking, onOpenCheckOut)}
          >
            Check-out
          </button>
        </>
      );
    }

    if (paymentStatus === 'paid') {
      return (
        <>
          <button type="button" className="status-btn confirmed" disabled>
            Đã thanh toán
          </button>
          <button
            type="button"
            className="status-btn check-in"
            onClick={() => tryOpenCheckIn(booking, onOpenCheckIn)}
          >
            Check-in
          </button>
        </>
      );
    }

    if (paymentStatus === 'pending') {
      const canRejectQr =
        booking.paymentMethod === 'qr_code' &&
        booking.qrPaymentReportedAt &&
        booking.qrPaymentProofUrl;
      const vnpayAwaitingVerify =
        booking.paymentMethod === 'vnpay' && booking.vnpayPaidAt && !booking.vnpayOwnerVerifiedAt;
      const vnpayWaitingGuestPay =
        booking.paymentMethod === 'vnpay' && !booking.vnpayPaidAt;

      return (
        <>
          <button type="button" className="status-btn pending" disabled>
            {vnpayAwaitingVerify
              ? 'VNPay đã thanh toán — chờ xác minh'
              : vnpayWaitingGuestPay
                ? 'Chờ khách thanh toán VNPay'
                : booking.paymentMethod === 'qr_code' && booking.qrPaymentReportedAt
                  ? 'Khách đã báo chuyển khoản'
                  : 'Chờ xác nhận'}
          </button>
          {canRejectQr && (
            <button type="button" className="status-btn reject" onClick={() => onOpenReject(booking)}>
              Xử lý minh chứng
            </button>
          )}
          {!vnpayWaitingGuestPay && (
            <button type="button" className="status-btn confirm" onClick={() => onOpenConfirm(booking)}>
              {vnpayAwaitingVerify ? 'Xác minh thanh toán VNPay' : 'Xác nhận'}
            </button>
          )}
        </>
      );
    }

    if (paymentStatus === 'cancelled') {
      if (needsOwnerRefundConfirm) {
        return (
          <>
            <button type="button" className="status-btn cancelled" disabled>
              Đã hủy (chờ hoàn tiền)
            </button>
            <button type="button" className="status-btn refund" onClick={() => onOpenRefund(booking)}>
              Xác nhận đã hoàn tiền
            </button>
          </>
        );
      }
      return (
        <>
          <button type="button" className="status-btn cancelled" disabled>
            {booking.guestCancelSnapshot?.wasPaid && booking.ownerRefundCompletedAt
              ? 'Đã hủy — đã hoàn tiền'
              : booking.vnpayPaidAt
                ? 'Đã hủy — VNPay đã trừ tiền'
                : 'Đã hủy'}
          </button>
          {canReopen && (
            <button type="button" className="status-btn reopen" onClick={() => onOpenReopen(booking)}>
              Mở lại đơn
            </button>
          )}
        </>
      );
    }

    return null;
  };

  return (
    <div className={`booking-card${highlightAction ? ' booking-card--needs-action' : ''}`}>
      <div className="booking-info">
        <div className="booking-id-row">
          <span className="booking-id-label">Mã đơn:</span>
          <span className="booking-id-value">{booking._id}</span>
          {actionLabel && <span className="booking-action-badge">{actionLabel}</span>}
        </div>
        <div className="guest-name">{guest.name || 'N/A'}</div>

        {guest.phone && (
          <div className="info-item">
            <FaPhone className="info-icon" />
            <span>{guest.phone}</span>
          </div>
        )}

        {booking.checkInDate && (
          <div className="info-item">
            <FaCalendarAlt className="info-icon" />
            <span>
              Nhận phòng: {formatDate(booking.checkInDate)}
              {booking.checkedInAt && (
                <span className="actual-time"> (Đã check-in: {formatDateTime(booking.checkedInAt)})</span>
              )}
            </span>
          </div>
        )}

        {booking.checkOutDate && (
          <div className="info-item">
            <FaCalendarAlt className="info-icon" />
            <span>
              Trả phòng: {formatDate(booking.checkOutDate)}
              {booking.checkedOutAt && (
                <span className="actual-time"> (Đã check-out: {formatDateTime(booking.checkedOutAt)})</span>
              )}
            </span>
          </div>
        )}

        <div className="info-item">
          <FaCreditCard className="info-icon" />
          <span>Phương thức thanh toán: {paymentMethodLabel}</span>
        </div>

        {(room.roomNumber || source) && (
          <div className="booking-tags">
            {room.roomNumber && <span className="tag room-tag">{room.roomNumber}</span>}
            {source && <span className="tag source-tag">{source}</span>}
          </div>
        )}

        {booking.paymentMethod === 'qr_code' && booking.qrPaymentReportedAt && (
          <div className="payment-proof-summary">
            <div className="proof-title">Minh chứng chuyển khoản đã gửi</div>
            <div className="proof-meta">Thời gian báo: {formatDateTime(booking.qrPaymentReportedAt)}</div>
            {booking.qrPaymentProofUrl && (
              <button
                type="button"
                className="proof-link"
                onClick={() => onPreviewProof(booking, 'qr-proof', booking.qrPaymentProofUrl)}
              >
                Xem ảnh minh chứng
              </button>
            )}
          </div>
        )}
      </div>

      <div className="booking-actions">
        <button className="status-btn detail" onClick={() => onOpenDetail(booking._id)}>
          Xem chi tiết
        </button>
        {renderStatusButtons()}
      </div>
    </div>
  );
};

export default OwnerBookingCard;

