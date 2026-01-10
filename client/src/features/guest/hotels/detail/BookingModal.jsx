import { useState } from 'react';
import { getImageUrl } from '@/constants/images';
import './BookingModal.scss';

/**
 * Booking Modal Component
 * Modal xác nhận đặt phòng với thông tin chi tiết phòng
 */
const BookingModal = ({ 
  isOpen, 
  room, 
  bookingDates, 
  onConfirm, 
  onClose 
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  if (!isOpen || !room) return null;

  const handleNextImage = () => {
    if (room.images && room.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex + 1) % room.images.length
      );
    }
  };

  const handlePrevImage = () => {
    if (room.images && room.images.length > 0) {
      setCurrentImageIndex((prevIndex) => 
        (prevIndex - 1 + room.images.length) % room.images.length
      );
    }
  };

  return (
    <div className="booking-modal-overlay" onClick={onClose}>
      <div className="booking-modal-content" onClick={(e) => e.stopPropagation()}>
        <h2>Xác nhận đặt phòng</h2>
        <div className="modal-room-details">
          {room.images && room.images.length > 0 ? (
            <div className="modal-image-container">
              <img 
                src={getImageUrl(room.images[currentImageIndex])} 
                alt={room.name} 
                className="modal-room-image"
              />
              {room.images.length > 1 && (
                <>
                  <button className="prev-image-btn" onClick={handlePrevImage}>&lt;</button>
                  <button className="next-image-btn" onClick={handleNextImage}>&gt;</button>
                </>
              )}
            </div>
          ) : (
            <img 
              src="https://via.placeholder.com/400x250?text=Không+có+hình" 
              alt={room.name} 
              className="modal-room-image"
            />
          )}
          <h3>{room.roomNumber || room.name}</h3>
          <p><strong>Số phòng:</strong> {room.roomNumber}</p>
          <p><strong>Loại phòng:</strong> {room.type}</p>
          <p><strong>Giá:</strong> {room.price.regular.toLocaleString('vi-VN')} VNĐ / đêm</p>
          <p><strong>Số lượng người tối đa:</strong> {room.maxPeople} người</p>
          <p><strong>Tiện ích:</strong> {room.facilities?.join(', ') || 'Không có'}</p>
          <p><strong>Mô tả:</strong> {room.description || 'Không có mô tả'}</p>
          <p><strong>Ngày nhận phòng:</strong> {bookingDates.checkInDate}</p>
          <p><strong>Ngày trả phòng:</strong> {bookingDates.checkOutDate}</p>
        </div>
        <div className="modal-actions">
          <button className="confirm-btn" onClick={onConfirm}>Tiếp tục (Đặt phòng)</button>
          <button className="cancel-btn" onClick={onClose}>Hủy</button>
        </div>
      </div>
    </div>
  );
};

export default BookingModal;

