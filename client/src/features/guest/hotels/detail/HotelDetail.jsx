import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { GuestLayout } from '@/features/guest/components/layout';
import api from '../../../../apis';
import { getImageUrl } from '../../../../constants/images';
import './HotelDetail.scss';

/**
 * Guest Hotel Detail page feature
 * Displays detailed information about a hotel and available rooms
 */
const GuestHotelDetailPage = () => {
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
  const [mainImage, setMainImage] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  useEffect(() => {
    const fetchHotelDetails = async () => {
      try {
        setLoading(true);
        const response = await api.userHotel.getHotelById(id);
        console.log('Hotel Detail Response:', response);
        setHotel(response);
        if (response.images && response.images.length > 0) {
          setMainImage(getImageUrl(response.images[0]));
        }
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
      const response = await api.userBooking.getAvailableRooms(id, bookingDates.checkInDate, bookingDates.checkOutDate);
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

  const handleRoomSelect = (room) => {
    setSelectedRoom(room);
    setCurrentImageIndex(0);
    setShowBookingModal(true);
  };

  const handleConfirmBooking = () => {
    if (selectedRoom) {
      navigate(`/booking/new`, {
        state: {
          hotelId: id,
          roomId: selectedRoom._id,
          checkInDate: bookingDates.checkInDate,
          checkOutDate: bookingDates.checkOutDate
        }
      });
    }
    setSelectedRoom(null);
  };

  const handleCloseModal = () => {
    setShowBookingModal(false);
    setSelectedRoom(null);
  };

  const handleNextImage = () => {
    if (selectedRoom && selectedRoom.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % selectedRoom.images.length
      );
    }
  };

  const handlePrevImage = () => {
    if (selectedRoom && selectedRoom.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex - 1 + selectedRoom.images.length) % selectedRoom.images.length
      );
    }
  };

  const handleSubImageClick = (imageSrc) => {
    setMainImage(getImageUrl(imageSrc));
  };

  if (loading && !hotel) {
    return (
      <GuestLayout>
        <div className="hotel-detail-container">
          <div className="loading">Đang tải...</div>
        </div>
      </GuestLayout>
    );
  }

  if (error && !hotel) {
    return (
      <GuestLayout>
        <div className="hotel-detail-container">
          <div className="error-message">{error}</div>
        </div>
      </GuestLayout>
    );
  }

  return (
    <GuestLayout>
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
                <>
                  <div className="main-image">
                    <img src={mainImage} alt={`${hotel.name} - Ảnh chính`} />
                  </div>
                  {hotel.images.length > 0 && (
                    <div className="sub-images">
                      {hotel.images.filter(image => getImageUrl(image) !== mainImage).map((image, index) => (
                        <div className="sub-image-item" key={index} onClick={() => handleSubImageClick(image)}>
                          <img src={getImageUrl(image)} alt={`${hotel.name} - Ảnh phụ ${index + 2}`} />
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="main-image">
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
                            src={room.images && room.images[0] ? getImageUrl(room.images[0]) : 'https://via.placeholder.com/300x200?text=Không+có+hình'} 
                            alt={room.name} 
                          />
                        </div>
                        <div className="room-info">
                          <h3>{room.roomNumber} </h3>
                          <p className="room-type">{room.type}</p>
                          <div className="room-price">
                            <span className="price">{room.price.regular.toLocaleString('vi-VN')} VNĐ</span>
                            <span className="per-night">/ đêm</span>
                          </div>
                          <button 
                            className="book-btn"
                            onClick={() => handleRoomSelect(room)}
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

            {/* Booking Confirmation Modal */}
            {showBookingModal && selectedRoom && (
              <div className="booking-modal-overlay" onClick={handleCloseModal}>
                <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
                  <h2>Xác nhận đặt phòng</h2>
                  <div className="modal-room-details">
                    {selectedRoom.images && selectedRoom.images.length > 0 ? (
                      <div className="modal-image-container">
                        <img 
                          src={getImageUrl(selectedRoom.images[currentImageIndex])} 
                          alt={selectedRoom.name} 
                          className="modal-room-image"
                        />
                        {selectedRoom.images.length > 1 && (
                          <>
                            <button className="prev-image-btn" onClick={handlePrevImage}>&lt;</button>
                            <button className="next-image-btn" onClick={handleNextImage}>&gt;</button>
                          </>
                        )}
                      </div>
                    ) : (
                      <img 
                        src="https://via.placeholder.com/400x250?text=Không+có+hình" 
                        alt={selectedRoom.name} 
                        className="modal-room-image"
                      />
                    )}
                    <h3>{selectedRoom.name}</h3>
                    <p><strong>Số phòng:</strong> {selectedRoom.roomNumber}</p>
                    <p><strong>Loại phòng:</strong> {selectedRoom.type}</p>
                    <p><strong>Giá:</strong> {selectedRoom.price.regular.toLocaleString('vi-VN')} VNĐ / đêm</p>
                    <p><strong>Số lượng người tối đa:</strong> {selectedRoom.maxPeople} người</p>
                    <p><strong>Tiện ích:</strong> {selectedRoom.facilities.join(', ')}</p>
                    <p><strong>Mô tả:</strong> {selectedRoom.description}</p>
                    <p><strong>Ngày nhận phòng:</strong> {bookingDates.checkInDate}</p>
                    <p><strong>Ngày trả phòng:</strong> {bookingDates.checkOutDate}</p>
                  </div>
                  <div className="modal-actions">
                    <button className="confirm-btn" onClick={handleConfirmBooking}>Tiếp tục (Đặt phòng)</button>
                    <button className="cancel-btn" onClick={handleCloseModal}>Hủy</button>
                  </div>
                </div>
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
    </GuestLayout>
  );
};

export default GuestHotelDetailPage;

