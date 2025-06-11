import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import api from '../../../apis';
import Navbar from "../../../components/User/Navbar/Navbar";
import Footer from "../../../components/User/Footer/Footer";
import './BookingDetail.scss';

const BookingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useSelector(state => state.user.user);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    if (!user) {
      navigate('/login', { state: { redirectUrl: `/booking/${id}` } });
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const response = await api.userBooking.getBookingById(id);
        setBooking(response);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin đặt phòng');
        setLoading(false);
        console.error('Error fetching booking:', err);
      }
    };

    fetchBookingDetails();
  }, [id, user, navigate]);

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN');
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

  const nextImage = () => {
    if (booking?.room?.images) {
      setCurrentImageIndex((prev) => 
        prev === booking.room.images.length - 1 ? 0 : prev + 1
      );
    }
  };

  const prevImage = () => {
    if (booking?.room?.images) {
      setCurrentImageIndex((prev) => 
        prev === 0 ? booking.room.images.length - 1 : prev - 1
      );
    }
  };

  if (loading) return (
    <>
      <Navbar />
      <div style={{ height: '100px' }}></div>
      <div className="booking-detail-container">
        <div className="loading">Đang tải...</div>
      </div>
      <Footer />
    </>
  );

  if (error) return (
    <>
      <Navbar />
      <div style={{ height: '100px' }}></div>
      <div className="booking-detail-container">
        <div className="error-message">{error}</div>
      </div>
      <Footer />
    </>
  );

  if (!booking) return (
    <>
      <Navbar />
      <div style={{ height: '100px' }}></div>
      <div className="booking-detail-container">
        <div className="error-message">Không tìm thấy thông tin đặt phòng</div>
      </div>
      <Footer />
    </>
  );

  return (
    <>
      <Navbar />
      <div style={{ height: '100px' }}></div>
      <div className="booking-detail-container">
        <div className="booking-header">
          <h1>Chi tiết đặt phòng</h1>
          <div className="booking-status">
            {renderBookingStatus(booking.paymentStatus)}
          </div>
        </div>

        <div className="booking-content">
          <div className="left-section">
            {/* Hotel Images */}
            <div className="image-section hotel-images">
              <h2>{booking.hotel?.name}</h2>
              <div className="image-gallery">
                {booking.hotel?.images && booking.hotel.images.length > 0 ? (
                  <>
                    <button className="gallery-nav prev" onClick={() => setCurrentImageIndex(prev => 
                      prev === 0 ? booking.hotel.images.length - 1 : prev - 1
                    )}>
                      <FaChevronLeft />
                    </button>
                    <div className="main-image">
                      <img 
                        src={`${import.meta.env.VITE_API_URL}${booking.hotel.images[currentImageIndex]}`}
                        alt={booking.hotel.name}
                      />
                    </div>
                    <button className="gallery-nav next" onClick={() => setCurrentImageIndex(prev => 
                      prev === booking.hotel.images.length - 1 ? 0 : prev + 1
                    )}>
                      <FaChevronRight />
                    </button>
                    <div className="image-counter">
                      {currentImageIndex + 1} / {booking.hotel.images.length}
                    </div>
                  </>
                ) : (
                  <div className="no-image">Không có ảnh khách sạn</div>
                )}
              </div>
            </div>

            {/* Room Images */}
            <div className="image-section room-images">
              <h2>Hình ảnh phòng</h2>
              <div className="image-gallery">
                {booking.room?.images && booking.room.images.length > 0 ? (
                  <>
                    <button className="gallery-nav prev" onClick={() => setCurrentImageIndex(prev => 
                      prev === 0 ? booking.room.images.length - 1 : prev - 1
                    )}>
                      <FaChevronLeft />
                    </button>
                    <div className="main-image">
                      <img 
                        src={`${import.meta.env.VITE_API_URL}${booking.room.images[currentImageIndex]}`}
                        alt={booking.room.name}
                      />
                    </div>
                    <button className="gallery-nav next" onClick={() => setCurrentImageIndex(prev => 
                      prev === booking.room.images.length - 1 ? 0 : prev + 1
                    )}>
                      <FaChevronRight />
                    </button>
                    <div className="image-counter">
                      {currentImageIndex + 1} / {booking.room.images.length}
                    </div>
                  </>
                ) : (
                  <div className="no-image">Không có ảnh phòng</div>
                )}
              </div>
            </div>
          </div>

          <div className="right-section">
            {/* Room Information */}
            <div className="room-info-section">
              <h2>Thông tin phòng</h2>
              <div className="room-details">
                <div className="detail-item">
                  <span className="label">Số phòng:</span>
                  <span className="value">{booking.room?.roomNumber}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Loại phòng:</span>
                  <span className="value">{booking.room?.type}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Giá phòng:</span>
                  <span className="value price">
                    {(booking.room?.price?.regular || 0).toLocaleString('vi-VN')} VNĐ/đêm
                  </span>
                </div>
                <div className="detail-item">
                  <span className="label">Số người tối đa:</span>
                  <span className="value">{booking.room?.maxPeople} người</span>
                </div>
                <div className="detail-item description">
                  <span className="label">Mô tả:</span>
                  <p className="value">{booking.room?.description}</p>
                </div>
                <div className="detail-item facilities">
                  <span className="label">Tiện nghi:</span>
                  <div className="facilities-list">
                    {booking.room?.facilities?.map((facility, index) => (
                      <span key={index} className="facility-tag">{facility}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Booking Information */}
            <div className="booking-info-section">
              <h2>Thông tin đặt phòng</h2>
              <div className="booking-details">
                <div className="detail-item">
                  <span className="label">Mã đặt phòng:</span>
                  <span className="value">{booking._id}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Ngày đặt:</span>
                  <span className="value">{formatDate(booking.createdAt)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Ngày nhận phòng:</span>
                  <span className="value">{formatDate(booking.checkInDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Ngày trả phòng:</span>
                  <span className="value">{formatDate(booking.checkOutDate)}</span>
                </div>
                <div className="detail-item">
                  <span className="label">Tổng tiền:</span>
                  <span className="value price">
                    {(booking.totalAmount || 0).toLocaleString('vi-VN')} VNĐ
                  </span>
                </div>
              </div>
            </div>
            <div className="action-buttons below-info">
              <button 
                className="home-btn"
                onClick={() => navigate('/')}
              >
                Quay về trang chủ
              </button>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BookingDetail; 