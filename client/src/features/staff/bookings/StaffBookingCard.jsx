import { FaPhone, FaCalendarAlt, FaCreditCard } from 'react-icons/fa';
import { formatDate, formatDateTime, tryOpenCheckIn, tryOpenCheckOut, getStaffActionLabel } from '@/shared/utils';

const StaffBookingCard = ({
  booking,
  highlightAction = false,
  showActionBadge = false,
  onOpenDetail,
  onOpenCheckIn,
  onOpenCheckOut,
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
  const isCheckedIn = booking.checkedInAt != null;
  const isCheckedOut = booking.checkedOutAt != null;
  const actionLabel = showActionBadge ? getStaffActionLabel(booking) : null;

  const renderStatusButtons = () => {
    if (isCheckedOut) {
      return (
        <button type="button" className="status-btn checked-out" disabled>
          Đã trả phòng
        </button>
      );
    }

    if (isCheckedIn) {
      return (
        <>
          <button type="button" className="status-btn checked-in" disabled>
            Đã nhận phòng
          </button>
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
      return (
        <button type="button" className="status-btn pending" disabled>
          {booking.paymentMethod === 'qr_code' && booking.qrPaymentReportedAt
            ? 'Chờ chủ KS xác nhận thanh toán'
            : 'Chờ xác nhận thanh toán'}
        </button>
      );
    }

    if (paymentStatus === 'cancelled') {
      return (
        <button type="button" className="status-btn cancelled" disabled>
          Đã hủy
        </button>
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

        {room.roomNumber && (
          <div className="booking-tags">
            <span className="tag room-tag">{room.roomNumber}</span>
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
        <button type="button" className="status-btn detail" onClick={() => onOpenDetail(booking._id)}>
          Xem chi tiết
        </button>
        {renderStatusButtons()}
      </div>
    </div>
  );
};

export default StaffBookingCard;
