import { getImageUrl } from '@/constants/images';
import { formatRoomType } from '@/constants/roomTypes';
import {
  formatDate,
  needsQrProofResubmit,
  isQrPaymentRejectedCancelled,
  getRoomPrice,
  shouldShowPendingHoldCountdown,
  isPendingHoldTrackable,
} from '@/shared/utils';
import { usePendingHoldCountdown } from '@/shared/hooks';

const BookingListItem = ({
  booking,
  statusNode,
  payingBookingId,
  canCancel,
  onOpenDetail,
  onContinuePayment,
  onOpenCancel,
  onHoldExpired,
}) => {
  const holdTrackable = isPendingHoldTrackable(booking);
  const showActiveCountdown = shouldShowPendingHoldCountdown(booking);
  const { formatted: holdCountdown, expired: holdExpired } = usePendingHoldCountdown(
    booking.pendingExpiresAt,
    { enabled: holdTrackable, onExpired: onHoldExpired }
  );

  return (
    <div className="booking-card">
      <div className="booking-header">
        <div className="hotel-info">
          <h2>{booking.hotel?.name || 'Không có tên khách sạn'}</h2>
          <p className="booking-dates">
            {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
          </p>
        </div>
        <div className="booking-status">{statusNode}</div>
      </div>

      {showActiveCountdown && holdCountdown && (
        <div className="pending-hold-countdown" role="status">
          <strong>Thời hạn giữ phòng:</strong> còn{' '}
          <span className="pending-hold-countdown__time">{holdCountdown}</span> — đơn sẽ tự hủy nếu
          chưa hoàn tất thanh toán
        </div>
      )}

      {holdTrackable && holdExpired && (
        <div className="pending-hold-countdown pending-hold-countdown--expired" role="status">
          Đơn đã quá thời hạn giữ phòng. Đang cập nhật trạng thái…
        </div>
      )}

      {needsQrProofResubmit(booking) && (
        <div className="booking-rejection-notice booking-rejection-notice--resubmit">
          <strong>Cần tải lại minh chứng:</strong> {booking.ownerPaymentRejectionReason || 'Minh chứng không hợp lệ'}
        </div>
      )}

      {isQrPaymentRejectedCancelled(booking) && (
        <div className="booking-rejection-notice">
          <strong>Đơn đã bị hủy:</strong> {booking.ownerPaymentRejectionReason || 'Thanh toán chưa thành công'}.
          Vui lòng đặt phòng mới nếu vẫn có nhu cầu.
        </div>
      )}

      {booking.ownerPaymentRejectionReason &&
        !needsQrProofResubmit(booking) &&
        !isQrPaymentRejectedCancelled(booking) && (
        <div className="booking-rejection-notice">
          <strong>Thông báo từ khách sạn:</strong> {booking.ownerPaymentRejectionReason}
        </div>
      )}

      <div className="booking-details">
        <div className="booking-details__main">
          <div className="room-info">
            <div className="room-image">
              {booking.room?.images?.[0] ? (
                <img src={getImageUrl(booking.room.images[0])} alt={booking.room?.name || 'Không có tên phòng'} />
              ) : (
                <div className="no-image">Không có ảnh</div>
              )}
            </div>
            <div className="room-details">
              <h3>{booking.room?.roomNumber || 'Không có số phòng'}</h3>
              <p className="room-type">{booking.room?.type ? formatRoomType(booking.room.type) : 'Không có loại phòng'}</p>
              <p className="room-price">{getRoomPrice(booking.room?.price).toLocaleString('vi-VN')} VNĐ/đêm</p>
            </div>
          </div>
          <div className="price-info">
            <span className="total-price">{(booking.finalAmount || 0).toLocaleString('vi-VN')} VNĐ</span>
          </div>
        </div>

        <div className="booking-actions">
          <div className="action-buttons">
            <button
              className={booking.checkedOutAt ? 'review-btn' : 'view-details-btn'}
              onClick={() => onOpenDetail(booking._id)}
            >
              {booking.checkedOutAt ? 'Đánh giá phòng' : 'Xem chi tiết'}
            </button>
            {booking.paymentStatus === 'pending' &&
              !holdExpired &&
              !(booking.paymentMethod === 'qr_code' && booking.qrPaymentReportedAt) && (
                <button
                  type="button"
                  className="pay-continue-btn"
                  onClick={() => onContinuePayment(booking)}
                  disabled={payingBookingId === booking._id}
                >
                  {payingBookingId === booking._id ? 'Đang mở thanh toán...' : 'Tiếp tục thanh toán'}
                </button>
              )}
            {canCancel && (
              <button className="cancel-booking-btn" onClick={() => onOpenCancel(booking._id)}>
                Hủy đặt phòng
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingListItem;

