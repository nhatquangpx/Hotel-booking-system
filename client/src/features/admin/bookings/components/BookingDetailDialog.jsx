import React, { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import api from '@/apis';
import { formatDate, formatDateTime } from '@/shared/utils';
import { resolveProofPreviewUrl } from '@/shared/utils/media/sensitiveMedia';
import './BookingDetailDialog.scss';

const BookingDetailDialog = ({ isOpen, onClose, bookingId }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  useEffect(() => {
    if (!isOpen || !bookingId) {
      setBooking(null);
      setError(null);
      return;
    }

    const fetchBookingData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.adminBooking.getBookingById(bookingId);
        setBooking(data);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin đặt phòng');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [isOpen, bookingId]);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết đơn đặt phòng"
      maxWidth="700px"
      className="booking-detail-dialog"
    >
      {loading ? (
        <div className="loading">Đang tải...</div>
      ) : error ? (
        <div className="error-message">{error}</div>
      ) : booking ? (
        <div className="booking-detail-content">
          <table className="booking-detail-table">
            <tbody>
              <tr>
                <td className="label">Mã đặt phòng:</td>
                <td className="value">{booking._id}</td>
              </tr>
              <tr>
                <td className="label">Ngày đặt hàng:</td>
                <td className="value">{formatDateTime(booking.createdAt)}</td>
              </tr>
              <tr>
                <td className="label">Khách hàng:</td>
                <td className="value">{booking.guest?.name || booking.userName || 'N/A'}</td>
              </tr>
              <tr>
                <td className="label">Email:</td>
                <td className="value">{booking.guest?.email || booking.userEmail || 'N/A'}</td>
              </tr>
              <tr>
                <td className="label">CCCD/CMND:</td>
                <td className="value">{booking.guestIdNumber || '—'}</td>
              </tr>
              {booking.guestIdImageFrontUrl && (
                <tr>
                  <td className="label">Ảnh CCCD mặt trước:</td>
                  <td className="value">
                    <button
                      type="button"
                      className="proof-link"
                      onClick={async () => {
                        try {
                          const url = await resolveProofPreviewUrl({
                            roleScope: 'admin',
                            bookingId: booking._id,
                            kind: 'id-image-front',
                            mediaRef: booking.guestIdImageFrontUrl,
                          });
                          setPreviewUrl((prev) => {
                            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                            return url;
                          });
                        } catch (err) {
                          setError(err.message || 'Không thể tải ảnh CCCD');
                        }
                      }}
                    >
                      Xem mặt trước
                    </button>
                  </td>
                </tr>
              )}
              {booking.guestIdImageBackUrl && (
                <tr>
                  <td className="label">Ảnh CCCD mặt sau:</td>
                  <td className="value">
                    <button
                      type="button"
                      className="proof-link"
                      onClick={async () => {
                        try {
                          const url = await resolveProofPreviewUrl({
                            roleScope: 'admin',
                            bookingId: booking._id,
                            kind: 'id-image-back',
                            mediaRef: booking.guestIdImageBackUrl,
                          });
                          setPreviewUrl((prev) => {
                            if (prev?.startsWith('blob:')) URL.revokeObjectURL(prev);
                            return url;
                          });
                        } catch (err) {
                          setError(err.message || 'Không thể tải ảnh CCCD');
                        }
                      }}
                    >
                      Xem mặt sau
                    </button>
                  </td>
                </tr>
              )}
              <tr>
                <td className="label">Khách sạn:</td>
                <td className="value">{booking.hotel?.name || booking.hotelName || 'N/A'}</td>
              </tr>
              <tr>
                <td className="label">Phòng:</td>
                <td className="value">{booking.room?.roomNumber || booking.roomName || 'N/A'}</td>
              </tr>
              <tr>
                <td className="label">Nhận phòng:</td>
                <td className="value">{formatDate(booking.checkInDate)}</td>
              </tr>
              <tr>
                <td className="label">Trả phòng:</td>
                <td className="value">{formatDate(booking.checkOutDate)}</td>
              </tr>
              <tr>
                <td className="label">Tổng tiền:</td>
                <td className="value">
                  {booking.finalAmount != null
                    ? `${Number(booking.finalAmount).toLocaleString('vi-VN')} VND`
                    : 'N/A'}
                </td>
              </tr>
            </tbody>
          </table>

          <div className="booking-info">
            <div className="payment-status">
              <span className="label">Trạng thái thanh toán:</span>
              <span className={`status-badge ${booking.paymentStatus}`}>
                {booking.paymentStatus === 'pending' && 'Chưa thanh toán'}
                {booking.paymentStatus === 'paid' && 'Đã thanh toán'}
                {booking.paymentStatus === 'cancelled' && 'Đã hủy'}
              </span>
            </div>
            <div className="payment-method">
              <span className="label">Phương thức thanh toán:</span>
              <span>
                {booking.paymentMethod === 'vnpay'
                  ? 'VNPay'
                  : booking.paymentMethod === 'qr_code'
                    ? 'QR chuyển khoản'
                    : booking.paymentMethod || '—'}
              </span>
            </div>
            <p className="admin-booking-detail-note">
              Trang này chỉ xem thông tin đơn. Cập nhật trạng thái thanh toán / hoàn tiền do chủ
              khách sạn trên trang owner.
            </p>
          </div>

          {booking.cancellationReason && (
            <div className="cancellation-info">
              <h4>Thông tin hủy đặt phòng</h4>
              <div className="info-item">
                <span className="label">Lý do hủy:</span>
                <span className="value">{booking.cancellationReason}</span>
              </div>
              {booking.cancelledAt && (
                <div className="info-item">
                  <span className="label">Thời gian hủy:</span>
                  <span className="value">{formatDateTime(booking.cancelledAt)}</span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : null}
      {previewUrl && (
        <div
          className="proof-preview-overlay"
          onClick={() => {
            if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
            setPreviewUrl(null);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.65)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh' }}>
            <img src={previewUrl} alt="Ảnh CCCD" style={{ maxWidth: '100%', maxHeight: '80vh' }} />
            <button
              type="button"
              onClick={() => {
                if (previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
                setPreviewUrl(null);
              }}
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default BookingDetailDialog;
