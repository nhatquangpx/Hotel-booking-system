import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { hotelAPI, roomAPI, bookingAPI } from '../../../apis';
import Navbar from "../../../components/User/Navbar/Navbar";
import Footer from "../../../components/User/Footer/Footer";
import './BookingPage.scss';

const BookingPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useSelector(state => state.auth?.user);
  const bookingData = location.state || {};
  
  const [hotel, setHotel] = useState(null);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    guestDetails: {
      fullName: user?.fullName || '',
      email: user?.email || '',
      phone: user?.phone || '',
      adults: 1,
      children: 0
    },
    paymentMethod: 'qr_code',
    specialRequests: ''
  });
  const [totalAmount, setTotalAmount] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (!bookingData.hotelId || !bookingData.roomId || !bookingData.checkInDate || !bookingData.checkOutDate) {
      setError('Thông tin đặt phòng không đầy đủ');
      setLoading(false);
      return;
    }

    const fetchBookingDetails = async () => {
      try {
        setLoading(true);
        
        // Lấy thông tin khách sạn
        const hotelResponse = await hotelAPI.getHotelById(bookingData.hotelId);
        setHotel(hotelResponse.data);
        
        // Lấy thông tin phòng
        const roomResponse = await roomAPI.getRoomById(bookingData.roomId);
        setRoom(roomResponse.data);
        
        // Tính số đêm
        const checkInDate = new Date(bookingData.checkInDate);
        const checkOutDate = new Date(bookingData.checkOutDate);
        const nights = Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24));
        
        // Tính tổng tiền
        const total = roomResponse.data.price.regular * nights;
        setTotalAmount(total);
        
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin đặt phòng');
        setLoading(false);
        console.error(err);
      }
    };

    fetchBookingDetails();
  }, [bookingData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      navigate('/login', { 
        state: { 
          redirectUrl: '/booking/new',
          bookingData
        } 
      });
      return;
    }
    
    try {
      setSubmitting(true);
      
      const bookingPayload = {
        hotelId: bookingData.hotelId,
        roomId: bookingData.roomId,
        checkInDate: bookingData.checkInDate,
        checkOutDate: bookingData.checkOutDate,
        ...formData
      };
      
      const response = await bookingAPI.createBooking(bookingPayload);
      
      setSuccessMessage('Đặt phòng thành công!');
      setTimeout(() => {
        navigate('/my-bookings');
      }, 2000);
      
      setSubmitting(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi khi đặt phòng');
      setSubmitting(false);
      console.error(err);
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
      <div className="booking-container">
        <h1>Đặt phòng</h1>
        
        {successMessage && (
          <div className="success-message">
            {successMessage}
          </div>
        )}
        
        <div className="booking-content">
          <div className="booking-details">
            {hotel && room && (
              <div className="booking-summary">
                <h2>Thông tin đặt phòng</h2>
                <div className="summary-item">
                  <span className="label">Khách sạn:</span>
                  <span className="value">{hotel.name}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Phòng:</span>
                  <span className="value">{room.name} ({room.type})</span>
                </div>
                <div className="summary-item">
                  <span className="label">Ngày nhận phòng:</span>
                  <span className="value">{new Date(bookingData.checkInDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Ngày trả phòng:</span>
                  <span className="value">{new Date(bookingData.checkOutDate).toLocaleDateString('vi-VN')}</span>
                </div>
                <div className="summary-item">
                  <span className="label">Số đêm:</span>
                  <span className="value">
                    {Math.ceil((new Date(bookingData.checkOutDate) - new Date(bookingData.checkInDate)) / (1000 * 60 * 60 * 24))}
                  </span>
                </div>
                <div className="summary-item total">
                  <span className="label">Tổng tiền:</span>
                  <span className="value price">{totalAmount.toLocaleString('vi-VN')} VNĐ</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="booking-form">
            <h2>Thông tin khách hàng</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="fullName">Họ tên</label>
                <input
                  type="text"
                  id="fullName"
                  name="guestDetails.fullName"
                  value={formData.guestDetails.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  name="guestDetails.email"
                  value={formData.guestDetails.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="phone">Số điện thoại</label>
                <input
                  type="tel"
                  id="phone"
                  name="guestDetails.phone"
                  value={formData.guestDetails.phone}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="adults">Số người lớn</label>
                  <input
                    type="number"
                    id="adults"
                    name="guestDetails.adults"
                    min="1"
                    value={formData.guestDetails.adults}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="children">Số trẻ em</label>
                  <input
                    type="number"
                    id="children"
                    name="guestDetails.children"
                    min="0"
                    value={formData.guestDetails.children}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="paymentMethod">Phương thức thanh toán</label>
                <div className="payment-method-info">
                  <p>Thanh toán qua mã QR</p>
                  <img src="/assets/qr-code.png" alt="QR Code" style={{ width: '200px', height: '200px' }} />
                  <p className="payment-note">Vui lòng quét mã QR để thanh toán</p>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="specialRequests">Yêu cầu đặc biệt</label>
                <textarea
                  id="specialRequests"
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleInputChange}
                  rows="4"
                ></textarea>
              </div>
              
              <div className="form-actions">
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => navigate(-1)}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="submit-btn"
                  disabled={submitting}
                >
                  {submitting ? 'Đang xử lý...' : 'Xác nhận đặt phòng'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default BookingPage; 