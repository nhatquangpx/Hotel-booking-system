import { FaPhone, FaCalendarAlt, FaCreditCard } from 'react-icons/fa';
import { formatDate, formatDateTime } from '@/shared/utils';
import { getImageUrl } from '@/constants/images';

const OwnerBookingCard = ({
  booking,
  source,
  onOpenDetail,
  onOpenConfirm,
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
  const isCheckedIn = booking.checkedInAt !== null && booking.checkedInAt !== undefined;
  const isCheckedOut = booking.checkedOutAt !== null && booking.checkedOutAt !== undefined;

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
          <button className="status-btn check-out" onClick={() => onOpenCheckOut(booking)}>
            Check-out
          </button>
        </>
      );
    }

    if (paymentStatus === 'paid') {
      return (
        <>
          <button className="status-btn confirmed">Đã xác nhận</button>
          <button className="status-btn check-in" onClick={() => onOpenCheckIn(booking)}>
            Check-in
          </button>
        </>
      );
    }

    if (paymentStatus === 'pending') {
      return (
        <>
          <button className="status-btn pending">
            {booking.paymentMethod === 'qr_code' && booking.qrPaymentReportedAt
              ? 'Khách đã báo chuyển khoản'
              : 'Chờ xác nhận'}
          </button>
          <button className="status-btn confirm" onClick={() => onOpenConfirm(booking)}>
            Xác nhận
          </button>
        </>
      );
    }

    if (paymentStatus === 'cancelled') {
      return (
        <button className="status-btn cancelled" disabled>
          Đã hủy
        </button>
      );
    }

    return null;
  };

  return (
    <div className="booking-card">
      <div className="booking-info">
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
                onClick={() => onPreviewProof(getImageUrl(booking.qrPaymentProofUrl))}
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

