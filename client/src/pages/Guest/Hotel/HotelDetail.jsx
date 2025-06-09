import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../apis';
import Navbar from "../../../components/User/Navbar/Navbar";
import Footer from "../../../components/User/Footer/Footer";
import './HotelDetailPage.scss';

const HotelDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [bookingDates, setBookingDates] = useState({
    checkInDate: '',
    checkOutDate: ''
  });
  const [searchPerformed, setSearchPerformed] = useState(false);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        const response = await api.userHotel.getHotelById(id);
        console.log('Hotel Detail Response:', response);
        setHotel(response);
        setLoading(false);
      } catch (err) {
        setError('Không thể tải thông tin khách sạn');
        setLoading(false);
        console.error(err);
      }
    };

    fetchHotelDetails();
  }, [id]);

  const handleBookingDateChange = (e) => {
    const { name, value } = e.target;
    setBookingDates(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const searchAvailableRooms = async () => {
    try {
      setLoading(true);
      const response = await api.userRoom.getRoomsByHotel(id, bookingDates);
      console.log('Rooms Response:', response);
      setRooms(Array.isArray(response) ? response : []);
      setSearchPerformed(true);
      setLoading(false);
    } catch (err) {
      setError('Không thể tải danh sách phòng');
      setLoading(false);
      console.error(err);
    }
  };

  const handleRoomSelect = (roomId) => {
    // Chuyển đến trang đặt phòng với thông tin đã chọn
    navigate(`/booking/new`, {
      state: {
        hotelId: id,
        roomId,
        checkInDate: bookingDates.checkInDate,
        checkOutDate: bookingDates.checkOutDate
      }
    });
  };

  if (loading && !hotel) {
    return (
      <>
        <Navbar />
        <div className="hotel-detail-container">
          <div className="loading">Đang tải...</div>
        </div>
        <Footer />
      </>
    );
  }

  if (error && !hotel) {
    return (
      <>
        <Navbar />
        <div className="hotel-detail-container">
          <div className="error-message">{error}</div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="hotel-detail-container">
        {hotel && (
          <>
            <div className="hotel-header">
              <h1>{hotel.name}</h1>
              <div className="hotel-rating">
                {Array(hotel.starRating).fill().map((_, i) => (
                  <span key={i} className="star">★</span>
                ))}
              </div>
              <p className="hotel-address">
                {`${hotel.address.number} ${hotel.address.street}, ${hotel.address.city}`}
              </p>
            </div>

            <div className="hotel-gallery">
              {hotel.images && hotel.images.length > 0 ? (
                hotel.images.map((image, index) => (
                  <div className="gallery-item" key={index}>
                    <img src={image} alt={`${hotel.name} - Ảnh ${index + 1}`} />
                  </div>
                ))
              ) : (
                <div className="gallery-item">
                  <img 
                    src="https://via.placeholder.com/800x500?text=Không+có+hình" 
                    alt={hotel.name} 
                  />
                </div>
              )}
            </div>

            <div className="hotel-description">
              <h2>Giới thiệu</h2>
              <p>{hotel.description}</p>
            </div>

            <div className="hotel-policies">
              <h2>Chính sách</h2>
              <div className="policy-details">
                <div className="policy-item">
                  <h3>Nhận phòng</h3>
                  <p>{hotel.policies.checkInTime}</p>
                </div>
                <div className="policy-item">
                  <h3>Trả phòng</h3>
                  <p>{hotel.policies.checkOutTime}</p>
                </div>
                <div className="policy-item">
                  <h3>Hủy phòng</h3>
                  <p>{hotel.policies.cancellationPolicy}</p>
                </div>
              </div>
            </div>

            <div className="booking-search">
              <h2>Tìm phòng trống</h2>
              <div className="date-picker">
                <div className="date-field">
                  <label htmlFor="checkInDate">Ngày nhận phòng</label>
                  <input
                    type="date"
                    id="checkInDate"
                    name="checkInDate"
                    value={bookingDates.checkInDate}
                    onChange={handleBookingDateChange}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="date-field">
                  <label htmlFor="checkOutDate">Ngày trả phòng</label>
                  <input
                    type="date"
                    id="checkOutDate"
                    name="checkOutDate"
                    value={bookingDates.checkOutDate}
                    onChange={handleBookingDateChange}
                    min={bookingDates.checkInDate || new Date().toISOString().split('T')[0]}
                  />
                </div>
                <button 
                  onClick={searchAvailableRooms}
                  disabled={!bookingDates.checkInDate || !bookingDates.checkOutDate}
                  className="search-btn"
                >
                  Tìm phòng
                </button>
              </div>
            </div>

            {loading && searchPerformed && (
              <div className="loading">Đang tìm phòng trống...</div>
            )}

            {searchPerformed && !loading && (
              <div className="room-list">
                <h2>Phòng có sẵn</h2>
                {rooms.length === 0 ? (
                  <div className="no-rooms">Không có phòng trống trong thời gian bạn chọn</div>
                ) : (
                  <div className="room-grid">
                    {rooms.map((room) => (
                      <div className="room-card" key={room._id}>
                        <div className="room-image">
                          <img 
                            src={room.images && room.images[0] || 'https://via.placeholder.com/300x200?text=Không+có+hình'} 
                            alt={room.name} 
                          />
                        </div>
                        <div className="room-info">
                          <h3>{room.name}</h3>
                          <p className="room-type">{room.type}</p>
                          <div className="room-price">
                            <span className="price">{room.price.regular.toLocaleString('vi-VN')} VNĐ</span>
                            <span className="per-night">/ đêm</span>
                          </div>
                          <button 
                            className="book-btn"
                            onClick={() => handleRoomSelect(room._id)}
                          >
                            Đặt phòng
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="hotel-contact">
              <h2>Thông tin liên hệ</h2>
              <div className="contact-details">
                <div className="contact-item">
                  <h3>Số điện thoại</h3>
                  <p>{hotel.contactInfo.phone}</p>
                </div>
                <div className="contact-item">
                  <h3>Email</h3>
                  <p>{hotel.contactInfo.email}</p>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <Footer />
    </>
  );
};

export default HotelDetailPage; 