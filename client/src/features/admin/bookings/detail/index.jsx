import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { AdminLayout } from '@/features/admin/components';
import api from '@/apis';
import { formatDate, formatDateTime } from '@/shared/utils';
import '@/features/admin/components/AdminComponents.scss';
import './BookingDetail.scss';

/**
 * Admin Booking Detail page feature
 * View booking details for admin
 */
const AdminBookingDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const data = await api.adminBooking.getBookingById(id);
        setBooking(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin đặt phòng');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id]);

  if (loading) return (
    <AdminLayout>
      <div>Đang tải...</div>
    </AdminLayout>
  );
  
  if (error) return (
    <AdminLayout>
      <div className="error-message">{error}</div>
    </AdminLayout>
  );

  if (!booking) return (
    <AdminLayout>
      <div className="error-message">Không tìm thấy thông tin đặt phòng</div>
    </AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="admin-detail-container">
        <h2>Chi tiết đơn đặt phòng</h2>
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
              <td className="value">
                {booking.hotel?._id ? (
                  <Link to={`/admin/hotels/${booking.hotel._id}`}>{booking.hotel?.name || booking.hotelName}</Link>
                ) : (booking.hotelName || 'N/A')}
              </td>
            </tr>
            <tr>
              <td className="label">Phòng:</td>
              <td className="value">
                {booking.room?._id ? (
                  <Link to={`/admin/rooms/${booking.room._id}`}>{booking.room?.roomNumber || booking.roomName}</Link>
                ) : (booking.roomName || 'N/A')}
              </td>
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
              <td className="value">{booking.totalAmount != null ? Number(booking.totalAmount).toLocaleString('vi-VN') + ' VND' : 'N/A'}</td>
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
            Trang này chỉ xem thông tin đơn. Cập nhật trạng thái thanh toán / hoàn tiền do chủ khách sạn trên trang owner.
          </p>
        </div>
        
        {booking.cancellationReason && (
          <div className="cancellation-info">
            <h3>Thông tin hủy đặt phòng</h3>
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
    </AdminLayout>
  );
};

export default AdminBookingDetailPage; 