import React, { useState } from 'react';
import { FaEdit, FaClock } from 'react-icons/fa';
import { getImageUrl } from '@/constants/images';
import ImageSlider from './ImageSlider';
import ImageModal from './ImageModal';
import './HotelInfoCard.scss';

/**
 * HotelInfoCard Component
 * Displays hotel image and basic information
 * @param {Object} hotel - Hotel object with image, name, description, checkIn, checkOut
 * @param {Function} onEdit - Callback when edit button is clicked
 */
const HotelInfoCard = ({ hotel, onEdit }) => {
  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);

  const formatTime = (time) => {
    if (!time) return '';
    if (typeof time === 'string' && time.includes(':')) {
      return time;
    }
    return time;
  };

  // Lấy danh sách ảnh từ mảng images
  const getHotelImages = () => {
    if (hotel?.images && hotel.images.length > 0) {
      return hotel.images.map(img => getImageUrl(img));
    }
    return ['/assets/default-hotel.jpg'];
  };

  const images = getHotelImages();

  // Lấy check-in và check-out từ policies
  const checkInTime = hotel?.policies?.checkInTime || '14:00';
  const checkOutTime = hotel?.policies?.checkOutTime || '12:00';

  const handleImageClick = (index) => {
    setModalIndex(index);
    setShowModal(true);
  };

  return (
    <div className="hotel-info-card">
      <div className="hotel-image-section">
        {images.length > 1 ? (
          <ImageSlider 
            images={images} 
            onImageClick={handleImageClick}
          />
        ) : (
          <img 
            src={images[0]} 
            alt={hotel?.name || 'Khách sạn'} 
            className="hotel-image"
            onClick={() => handleImageClick(0)}
          />
        )}
        <div className="hotel-name-overlay">
          {hotel?.name || 'StayJourney Hotel'}
        </div>
        {onEdit && (
          <button className="edit-button" onClick={onEdit}>
            <FaEdit />
            Chỉnh sửa
          </button>
        )}
      </div>

      <ImageModal
        isOpen={showModal}
        images={images}
        initialIndex={modalIndex}
        onClose={() => setShowModal(false)}
      />
      
      <div className="hotel-details">
        <div className="hotel-description">
          {hotel?.description || 'Khách sạn hiện đại với vị trí trung tâm, phòng ốc sạch sẽ và dịch vụ chu đáo. Chúng tôi cam kết mang đến trải nghiệm lưu trú tuyệt vời cho mọi khách hàng.'}
        </div>
        
        <div className="hotel-times">
          <div className="time-item">
            <FaClock className="time-icon" />
            <span>Check-in {formatTime(checkInTime)}</span>
          </div>
          <div className="time-item">
            <FaClock className="time-icon" />
            <span>Check-out {formatTime(checkOutTime)}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelInfoCard;

