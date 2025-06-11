import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../../apis';
import Navbar from "../../../components/User/Navbar/Navbar";
import Footer from "../../../components/User/Footer/Footer";
import './MyBookingsPage.scss';

const MyBookingsPage = () => {
  const navigate = useNavigate();
  const user = useSelector(state => state.user.user);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBookingId, setCancelBookingId] = useState(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { redirectUrl: '/my-bookings' } });
      return;
    }

    const fetchBookings = async () => {
      try {
        setLoading(true);
        const response = await api.userBooking.getMyBookings();
        if (response && Array.isArray(response)) {
          setBookings(response);
        } else {
          setBookings([]);
        }
        setLoading(false);
      } catch (err) {
        setError('Không thể tải danh sách đặt phòng');
        setLoading(false);
        console.error('Error fetching bookings:', err);
      }
    };

    fetchBookings();
  }, [user, navigate]);

  const openCancelModal = (bookingId) => {
    setCancelBookingId(bookingId);
    setShowCancelModal(true);
  };

  const closeCancelModal = () => {
    setCancelBookingId(null);
    setCancelReason('');
    setShowCancelModal(false);
  };

  const handleCancelBooking = async () => {
    if (!cancelBookingId) return;

    try {
      setCancelling(true);
      await api.userBooking.cancelBooking(cancelBookingId, cancelReason);
      
      // Cập nhật trạng thái đặt phòng trong danh sách
      setBookings(prevBookings => 
        prevBookings.map(booking => 
          booking._id === cancelBookingId 
            ? { ...booking, paymentStatus: 'cancelled' } 
            : booking
        )
      );
      
      closeCancelModal();
      setCancelling(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Không thể hủy đặt phòng');
      setCancelling(false);
      console.error(err);
    }
  };

  const renderBookingStatus = (status) => {
    switch (status) {
      case 'pending':
        return <span className="status pending">Chờ thanh toán</span>;
      case 'paid':
        return <span className="status paid">Đã thanh toán</span>;
      case 'cancelled':
        return <span className="status cancelled">Đã hủy</span>;
      default:
        return <span className="status">{status}</span>;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
  };

  const canCancelBooking = (booking) => {
    if (booking.paymentStatus === 'cancelled' || booking.paymentStatus === 'paid') {
      return false;
    }
    
    const checkInDate = new Date(booking.checkInDate);
    const today = new Date();
    const daysUntilCheckIn = Math.ceil((checkInDate - today) / (1000 * 60 * 60 * 24));
    
    return daysUntilCheckIn >= 2;
  };

  return (
    <>
      <Navbar />
      <div style={{ height: '100px' }}></div>
      <div className="my-bookings-container">
        <h1>Danh sách đặt phòng của tôi</h1>
        <div className="cancel-policy-reminder">
          <strong>Lưu ý:</strong> Bạn chỉ có thể hủy đơn đặt phòng nếu đơn chưa thanh toán và còn cách ngày nhận phòng ít nhất <strong>2 ngày</strong>. Nếu đơn đã thanh toán, vui lòng liên hệ hotline <a href="tel:0332915004">0332915004</a> để được hỗ trợ.
        </div>
        
        {loading && <div className="loading">Đang tải...</div>}
        
        {error && <div className="error-message">{error}</div>}
        
        {!loading && !error && (!bookings || bookings.length === 0) && (
          <div className="no-bookings">
            <p>Bạn chưa có đặt phòng nào</p>
            <button 
              className="browse-hotels-btn"
              onClick={() => navigate('/hotels')}
            >
              Tìm khách sạn ngay
            </button>
          </div>
        )}
        
        {!loading && !error && bookings && bookings.length > 0 && (
          <div className="bookings-list">
            {bookings.map((booking) => (
              <div className="booking-card" key={booking._id}>
                <div className="booking-header">
                  <div className="hotel-info">
                    <h2>{booking.hotel?.name || 'Không có tên khách sạn'}</h2>
                    <p className="booking-dates">
                      {formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}
                    </p>
                  </div>
                  <div className="booking-status">
                    {renderBookingStatus(booking.paymentStatus)}
                  </div>
                </div>
                
                <div className="booking-details">
                  <div className="room-info">
                    <div className="room-image">
                      {booking.room?.images?.[0] ? (
                        <img 
                          src={`${import.meta.env.VITE_API_URL}${booking.room.images[0]}`}
                          alt={booking.room?.name || 'Không có tên phòng'} 
                        />
                      ) : (
                        <div className="no-image">Không có ảnh</div>
                      )}
                    </div>
                    <div className="room-details">
                      <h3>{booking.room?.roomNumber || 'Không có số phòng'}</h3>
                      <p className="room-type">{booking.room?.type || 'Không có loại phòng'}</p>
                      <p className="room-price">
                        {(booking.room?.price?.regular || 0).toLocaleString('vi-VN')} VNĐ/đêm
                      </p>
                    </div>
                  </div>
                  
                  <div className="booking-actions">
                    <div className="price-info">
                      <span className="total-price">
                        {(booking.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                      </span>
                    </div>
                    <div className="action-buttons">
                      <button 
                        className="view-details-btn"
                        onClick={() => navigate(`/booking/${booking._id}`)}
                      >
                        Xem chi tiết
                      </button>
                      {canCancelBooking(booking) && (
                        <button 
                          className="cancel-booking-btn"
                          onClick={() => openCancelModal(booking._id)}
                        >
                          Hủy đặt phòng
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Modal hủy đặt phòng */}
        {showCancelModal && (
          <div className="cancel-modal-overlay">
            <div className="cancel-modal">
              <h2>Xác nhận hủy đặt phòng</h2>
              <p>Bạn có chắc chắn muốn hủy đặt phòng này?</p>
              
              <div className="form-group">
                <label htmlFor="cancelReason">Lý do hủy</label>
                <textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Vui lòng cho biết lý do hủy đặt phòng"
                  rows="4"
                ></textarea>
              </div>
              
              <div className="modal-actions">
                <button 
                  className="cancel-btn"
                  onClick={closeCancelModal}
                  disabled={cancelling}
                >
                  Đóng
                </button>
                <button 
                  className="confirm-btn"
                  onClick={handleCancelBooking}
                  disabled={cancelling || !cancelReason.trim()}
                >
                  {cancelling ? 'Đang xử lý...' : 'Xác nhận hủy'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default MyBookingsPage; 