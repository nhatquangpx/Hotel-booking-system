import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import api from '../../../apis';
import Navbar from "../../../components/User/Navbar/Navbar";
import Footer from "../../../components/User/Footer/Footer";
import './Booking.scss';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state || {};
  
  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    paymentMethod: 'qr_code',
    specialRequests: ''
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showPaymentQRCode, setShowPaymentQRCode] = useState(false);
  const [countdown, setCountdown] = useState(900); // 15 phút = 900 giây
  const countdownRef = useRef();
  const [guest, setGuest] = useState(null);
  const user = useSelector((state) => state.user.user);


  useEffect(() => {
    if (bookingData.bookingId) {
      const fetchBooking = async () => {
        try {
          setLoading(true);
          const bookingRes = await api.userBooking.getBookingById(bookingData.bookingId);
          setBooking(bookingRes);
          setGuest(bookingRes.guest);
          setHotel(bookingRes.hotel);
          setRoom(bookingRes.room);
          setTotalAmount(bookingRes.totalAmount);
          setLoading(false);
        } catch (err) {
          setError('Không thể tải thông tin đặt phòng');
          setLoading(false);
        }
      };
      fetchBooking();
      return;
    }
    if (!bookingData.hotelId || !bookingData.roomId || !bookingData.checkInDate || !bookingData.checkOutDate) {
      setError('Thông tin đặt phòng không đầy đủ');
      setLoading(false);
      return;
    }
    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        const guestResponse = await api.user.getUserProfile(user.id);
        setGuest(guestResponse);
        const hotelResponse = await api.userHotel.getHotelById(bookingData.hotelId);
        setHotel(hotelResponse);
        const roomResponse = await api.userRoom.getRoomById(bookingData.roomId);
        setRoom(roomResponse);
        const checkInDate = new Date(bookingData.checkInDate);
        const checkOutDate = new Date(bookingData.checkOutDate);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        const total = roomResponse.price.regular * nights;
        setTotalAmount(total);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin đặt phòng');
        setLoading(false);
      }
    };
    fetchBookingDetails();
  }, [bookingData]);

  useEffect(() => {
    if (showPaymentQRCode) {
      setCountdown(900);
      countdownRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdownRef.current);
    }
  }, [showPaymentQRCode]);

  useEffect(() => {
    if (showPaymentQRCode && countdown === 0) {
      navigate('/my-bookings');
    }
  }, [showPaymentQRCode, countdown, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name.includes('guestDetails.')) {
      const guestField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        guestDetails: {
          ...prev.guestDetails,
          [guestField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = async () => {
    if (!bookingData.bookingId) {
      try {
        setSubmitting(true);
        
        const bookingPayload = {
          guest: bookingData.guest,
          hotel: bookingData.hotelId,
          room: bookingData.roomId,
          checkInDate: bookingData.checkInDate,
          checkOutDate: bookingData.checkOutDate,
          totalAmount: totalAmount,
          paymentMethod: formData.paymentMethod,
          specialRequests: formData.specialRequests || ''
        };
        
        const response = await api.userBooking.createBooking(bookingPayload);
        
        setSuccessMessage('Đặt phòng thành công! Vui lòng quét mã QR để thanh toán.');
        setShowPaymentQRCode(true);

        setTimeout(() => {
          navigate('/my-bookings');
        }, 900000);
        
        setSubmitting(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đặt phòng');
        setSubmitting(false);
        console.error(err);
      }
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="booking-container">
          <div className="loading">Đang tải thông tin đặt phòng...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (error) {
    return (
      <>
        <Navbar />
        <div className="booking-container">
          <div className="error-message">{error}</div>
          <button 
            className="back-btn"
            onClick={() => navigate(-1)}
          >
            Quay lại
          </button>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div style={{ height: '100px' }}></div>
      <div className="booking-container">
        <h1>Đặt phòng</h1>
        
        {successMessage && !showPaymentQRCode && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        <div className="booking-content">
          <div className="booking-images">
            {hotel && hotel.images && hotel.images.length > 0 && (
              <div className="hotel-image-section">
                <h3>Khách sạn</h3>
                <img src={`${import.meta.env.VITE_API_URL}${hotel.images[0]}`} alt={hotel.name} className="hotel-photo" />
              </div>
            )}
            {room && room.images && room.images.length > 0 && (
              <div className="room-image-section">
                <h3>Phòng đã đặt</h3>
                <img src={`${import.meta.env.VITE_API_URL}${room.images[0]}`} alt={room.name} className="room-photo" />
              </div>
            )}
            {showPaymentQRCode && (
              <div className="payment-qr-code-section">
                <h2>Thanh toán</h2>
                <p className="payment-instructions">Vui lòng quét mã QR dưới đây để hoàn tất thanh toán. Đơn đặt phòng của bạn sẽ được xác nhận sau khi nhận được thanh toán.</p>
                <img src="/assets/qr-code.png" alt="QR Code Thanh Toán" className="qr-code-image" />
                <p className="payment-note">Sau khi thanh toán thành công, bạn sẽ được chuyển hướng đến trang đặt phòng của tôi.</p>
                <div className="countdown-timer">
                  Tự động chuyển hướng sau: <span className="countdown-value">{Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')}</span> phút
                </div>
                <button 
                  className="back-to-bookings-btn" 
                  onClick={() => navigate('/my-bookings')}
                >
                  Xem đơn đặt phòng của tôi
                </button>
              </div>
            )}
          </div>

          <div className="booking-details">
            {hotel && room && (
              <>
                <div className="room-info-section">
                  <h2>Thông tin phòng</h2>
                  <div className="room-details">
                    <div className="detail-item">
                      <span className="label">Số phòng:</span>
                      <span className="value">{room.roomNumber}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Loại phòng:</span>
                      <span className="value">{room.type}</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Giá phòng:</span>
                      <span className="value price">{room.price?.regular?.toLocaleString('vi-VN')} VNĐ/đêm</span>
                    </div>
                    <div className="detail-item">
                      <span className="label">Số người tối đa:</span>
                      <span className="value">{room.maxPeople} người</span>
                    </div>
                    <div className="detail-item description">
                      <span className="label">Mô tả:</span>
                      <p className="value">{room.description}</p>
                    </div>
                    <div className="detail-item facilities">
                      <span className="label">Tiện nghi:</span>
                      <div className="facilities-list">
                        {room.facilities?.map((facility, index) => (
                          <span key={index} className="facility-tag">{facility}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="booking-summary">
                  <h2>Thông tin đặt phòng</h2>
                  <div className="summary-item">
                    <span className="label">Tên khách hàng:</span>
                    <span className="value">{guest.name || ''}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Khách sạn:</span>
                    <span className="value">{hotel.name}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Số phòng:</span>
                    <span className="value">{room.roomNumber}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Ngày nhận phòng:</span>
                    <span className="value">{new Date(bookingData.checkInDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">Ngày trả phòng:</span>
                    <span className="value">{new Date(bookingData.checkOutDate).toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="summary-item total">
                    <span className="label">Tổng tiền:</span>
                    <span className="value price">{totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                  </div>
                </div>
                {showPaymentQRCode && (
                  <div className="payment-guide-section">
                    <h2>Hướng dẫn thanh toán</h2>
                    <p>Vui lòng chuyển khoản qua tài khoản sau:</p>
                    <p>Chủ tài khoản: <span className="account-name">DOAN NHAT QUANG</span></p>
                    <p>Số tài khoản: <span className="account-number">0334978774</span></p>
                    <p>Ngân hàng: <span className="bank-name">Ngân hàng MB Bank</span></p>
                    <p>Nội dung chuyển khoản: <span className="transfer-note">TEN_NGUOI_DUNG - KHACH_SAN - SO_PHONG_DA_DAT - NGAY_CHECKIN - NGAY_CHECKOUT</span></p>
                  </div>
                )}
                {!showPaymentQRCode && (
                  <div className="booking-actions-confirm">
                    <div className="form-group">
                      <label htmlFor="specialRequests">Yêu cầu đặc biệt (tùy chọn)</label>
                      <textarea
                        id="specialRequests"
                        name="specialRequests"
                        value={formData.specialRequests}
                        onChange={handleInputChange}
                        rows="3"
                        placeholder="Ví dụ: Yêu cầu setup trước như thế nào, hoặc cần đồ dùng đặc biệt..."
                      ></textarea>
                    </div>
                    <button
                      type="button"
                      className="cancel-btn"
                      onClick={() => navigate(-1)}
                    >
                      Hủy
                    </button>
                    <button
                      type="button"
                      className="submit-btn"
                      onClick={handleSubmit}
                      disabled={submitting}
                    >
                      {submitting ? 'Đang xử lý...' : 'Xác nhận đặt phòng và Thanh toán'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BookingPage; 