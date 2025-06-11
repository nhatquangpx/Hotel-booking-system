import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/AdminLayout';
import api from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';
import './BookingDetail.scss';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    const fetchBookingData = async () => {
      try {
        setLoading(true);
        const data = await api.adminBooking.getBookingById(id);
        setBooking(data);
        setNewStatus(data.status);
        setError(null);
      } catch (err) {
        setError(err.message || 'Có lỗi xảy ra khi tải thông tin đặt phòng');
      } finally {
        setLoading(false);
      }
    };

    fetchBookingData();
  }, [id]);

  const handleUpdateClick = () => {
    setShowUpdateModal(true);
  };

  const handleConfirmUpdate = async () => {
    try {
      await api.adminBooking.updateBookingStatus(id, { status: newStatus });
      setBooking(prev => ({ ...prev, status: newStatus }));
      setShowUpdateModal(false);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra khi cập nhật trạng thái đặt phòng');
    }
  };

  const handleCancelUpdate = () => {
    setShowUpdateModal(false);
    setNewStatus(booking.status);
  };

  // Format ngày tháng
  const formatDate = (dateString) => {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

  // Format ngày giờ đầy đủ
  const formatDateTime = (dateString) => {
    const options = { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString('vi-VN', options);
  };

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
              <td className="value">{formatDate(booking.checkInDate || booking.checkIn)}</td>
            </tr>
            <tr>
              <td className="label">Trả phòng:</td>
              <td className="value">{formatDate(booking.checkOutDate || booking.checkOut)}</td>
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
            <span>Thanh toán qua mã QR</span>
          </div>
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

      {showUpdateModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Cập nhật trạng thái đặt phòng</h2>
              <button className="close-button" onClick={handleCancelUpdate}>&times;</button>
            </div>
            <div className="modal-body">
              <p>
                Cập nhật trạng thái cho đơn đặt phòng #{booking._id.slice(-6).toUpperCase()} - 
                {booking.hotelName} ({formatDate(booking.checkIn)} - {formatDate(booking.checkOut)})
              </p>
              
              <div className="form-group">
                <label htmlFor="status">Trạng thái mới</label>
                <select
                  id="status"
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                  required
                >
                  <option value="pending">Chờ xác nhận</option>
                  <option value="confirmed">Đã xác nhận</option>
                  <option value="cancelled">Đã hủy</option>
                  <option value="completed">Hoàn thành</option>
                </select>
              </div>
              
              <div className="form-actions">
                <button className="cancel-btn" onClick={handleCancelUpdate}>Hủy</button>
                <button className="submit-btn" onClick={handleConfirmUpdate}>Cập nhật</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
};

export default BookingDetail; 