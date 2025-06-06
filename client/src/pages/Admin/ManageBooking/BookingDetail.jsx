import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AdminLayout from '../../../components/Admin/AdminLayout';
import { bookingAPI } from '../../../apis';
import '../../../components/Admin/AdminComponents.scss';

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
        const data = await bookingAPI.getBookingById(id);
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
      await bookingAPI.updateBookingStatus(id, { status: newStatus });
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
        <div className="detail-header">
          <h2>Chi tiết đặt phòng #{booking._id.slice(-6).toUpperCase()}</h2>
          <div className="detail-actions">
            <button 
              className="edit-btn"
              onClick={handleUpdateClick}
            >
              Cập nhật trạng thái
            </button>
            <button 
              className="back-btn"
              onClick={() => navigate('/admin/bookings')}
            >
              Quay lại
            </button>
          </div>
        </div>
        
        <div className="booking-status-bar">
          <div className="status-label">Trạng thái:</div>
          <div className={`status-badge ${booking.status}`}>
            {booking.status === 'pending' && 'Chờ xác nhận'}
            {booking.status === 'confirmed' && 'Đã xác nhận'}
            {booking.status === 'cancelled' && 'Đã hủy'}
            {booking.status === 'completed' && 'Hoàn thành'}
          </div>
        </div>
        
        <div className="booking-info">
          <div className="info-card">
            <h3>Thông tin đặt phòng</h3>
            <div className="info-item">
              <span className="label">Mã đặt phòng:</span>
              <span className="value">{booking._id}</span>
            </div>
            <div className="info-item">
              <span className="label">Ngày đặt:</span>
              <span className="value">{formatDateTime(booking.createdAt)}</span>
            </div>
            <div className="info-item">
              <span className="label">Nhận phòng:</span>
              <span className="value">{formatDate(booking.checkIn)}</span>
            </div>
            <div className="info-item">
              <span className="label">Trả phòng:</span>
              <span className="value">{formatDate(booking.checkOut)}</span>
            </div>
            <div className="info-item">
              <span className="label">Số đêm:</span>
              <span className="value">{booking.nights}</span>
            </div>
            <div className="info-item">
              <span className="label">Số lượng khách:</span>
              <span className="value">{booking.guests} người</span>
            </div>
          </div>
          
          <div className="info-card">
            <h3>Thông tin khách hàng</h3>
            <div className="info-item">
              <span className="label">Họ tên:</span>
              <span className="value">{booking.userName}</span>
            </div>
            <div className="info-item">
              <span className="label">Email:</span>
              <span className="value">{booking.userEmail}</span>
            </div>
            <div className="info-item">
              <span className="label">Số điện thoại:</span>
              <span className="value">{booking.userPhone}</span>
            </div>
            <div className="info-item">
              <span className="label">Ghi chú đặc biệt:</span>
              <span className="value">{booking.specialRequests || 'Không có'}</span>
            </div>
          </div>
        </div>
        
        <div className="booking-details">
          <h3>Chi tiết phòng đã đặt</h3>
          <div className="room-card">
            <div className="room-info">
              <h4>{booking.roomName}</h4>
              <p>Tại {booking.hotelName}</p>
              <div className="room-detail">
                <span className="label">Loại phòng:</span>
                <span className="value">{booking.roomType}</span>
              </div>
              <div className="room-detail">
                <span className="label">Giá phòng:</span>
                <span className="value">{booking.roomPrice?.toLocaleString('vi-VN')} VND / đêm</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="payment-info">
          <h3>Chi tiết thanh toán</h3>
          <div className="price-details">
            <div className="price-item">
              <span>Giá phòng ({booking.nights} đêm):</span>
              <span>{(booking.roomPrice * booking.nights).toLocaleString('vi-VN')} VND</span>
            </div>
            {booking.taxFee > 0 && (
              <div className="price-item">
                <span>Thuế và phí:</span>
                <span>{booking.taxFee.toLocaleString('vi-VN')} VND</span>
              </div>
            )}
            {booking.discount > 0 && (
              <div className="price-item discount">
                <span>Giảm giá:</span>
                <span>-{booking.discount.toLocaleString('vi-VN')} VND</span>
              </div>
            )}
            <div className="price-total">
              <span>Tổng thanh toán:</span>
              <span>{booking.totalPrice.toLocaleString('vi-VN')} VND</span>
            </div>
          </div>
          <div className="payment-status">
            <span className="label">Trạng thái thanh toán:</span>
            <span className={`status-badge ${booking.paymentStatus}`}>
              {booking.paymentStatus === 'pending' && 'Chưa thanh toán'}
              {booking.paymentStatus === 'paid' && 'Đã thanh toán'}
              {booking.paymentStatus === 'refunded' && 'Đã hoàn tiền'}
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