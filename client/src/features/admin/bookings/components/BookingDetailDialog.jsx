import React, { useState, useEffect } from 'react';
import Dialog from '@/components/ui/Dialog';
import api from '@/apis';
import { formatDate, formatDateTime } from '@/shared/utils';
import './BookingDetailDialog.scss';

const BookingDetailDialog = ({ isOpen, onClose, bookingId }) => {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
                  {booking.totalAmount != null
                    ? `${Number(booking.totalAmount).toLocaleString('vi-VN')} VND`
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
    </Dialog>
  );
};

export default BookingDetailDialog;
