import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { GuestLayout } from '@/features/guest/components/layout';
import { BookingReview } from './BookingReview';
import api from '@/apis';
import { getImageUrl } from '@/constants/images';
import { formatDate } from '@/shared/utils';
import './BookingDetail.scss';

/**
 * Guest Booking Detail page feature
 * Detailed booking information for guest users
 */
const GuestBookingDetailPage = () => {
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

  // Callback để reload booking sau khi review được tạo/sửa/xóa
  const handleReviewUpdate = async () => {
    try {
      const response = await api.userBooking.getBookingById(id);
      setBooking(response);
    } catch (err) {
      console.error('Error reloading booking after review update:', err);
    }
  };


  const renderBookingStatus = (booking) => {
    // Nếu đã hủy
    if (booking.paymentStatus === 'cancelled') {
      return <span className="status cancelled">Đã hủy</span>;
    }
    
    // Nếu đã checkout (ưu tiên cao nhất)
    if (booking.checkedOutAt) {
      return <span className="status checked-out">Đã checkout</span>;
    }
    
    // Nếu đã checkin nhưng chưa checkout
    if (booking.checkedInAt) {
      return <span className="status checked-in">Đã checkin</span>;
    }
    
    // Nếu đã thanh toán nhưng chưa checkin
    if (booking.paymentStatus === 'paid') {
      return <span className="status paid">Đã thanh toán</span>;
    }
    
    // Chờ thanh toán
    if (booking.paymentStatus === 'pending') {
      return <span className="status pending">Chờ thanh toán</span>;
    }
    
    return <span className="status">{booking.paymentStatus}</span>;
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
    <GuestLayout>
      <div className="booking-detail-container">
        <div className="loading">Đang tải...</div>
      </div>
    </GuestLayout>
  );

  if (error) return (
    <GuestLayout>
      <div className="booking-detail-container">
        <div className="error-message">{error}</div>
      </div>
    </GuestLayout>
  );

  if (!booking) return (
    <GuestLayout>
      <div className="booking-detail-container">
        <div className="error-message">Không tìm thấy thông tin đặt phòng</div>
      </div>
    </GuestLayout>
  );

  return (
    <GuestLayout>
      <div className="booking-detail-container">
        <div className="booking-header">
          <h1>Chi tiết đặt phòng</h1>
          <div className="booking-status">
            {renderBookingStatus(booking)}
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
                        src={getImageUrl(booking.hotel.images[currentImageIndex])}
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
                        src={getImageUrl(booking.room.images[currentImageIndex])}
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

            {/* Review Section */}
            <BookingReview 
              booking={booking}
              existingReview={booking.review || null}
              onReviewUpdate={handleReviewUpdate}
            />

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
    </GuestLayout>
  );
};

export default GuestBookingDetailPage;

