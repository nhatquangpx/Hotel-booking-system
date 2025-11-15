import React from 'react';
import { FaEdit, FaClock } from 'react-icons/fa';
import { getImageUrl } from '@/constants/images';
import './HotelInfoCard.scss';

/**
 * HotelInfoCard Component
 * Displays hotel image and basic information
 * @param {Object} hotel - Hotel object with image, name, description, checkIn, checkOut
 * @param {Function} onEdit - Callback when edit button is clicked
 */
const HotelInfoCard = ({ hotel, onEdit }) => {
  const formatTime = (time) => {
    if (!time) return '';
    if (typeof time === 'string' && time.includes(':')) {
      return time;
    }
    return time;
  };

  return (
    <div className="hotel-info-card">
      <div className="hotel-image-section">
        <img 
          src={hotel?.image ? getImageUrl(hotel.image) : '/assets/default-hotel.jpg'} 
          alt={hotel?.name || 'Khách sạn'} 
          className="hotel-image"
        />
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
      
      <div className="hotel-details">
        <div className="hotel-description">
          {hotel?.description || 'Khách sạn hiện đại với vị trí trung tâm, phòng ốc sạch sẽ và dịch vụ chu đáo. Chúng tôi cam kết mang đến trải nghiệm lưu trú tuyệt vời cho mọi khách hàng.'}
        </div>
        
        <div className="hotel-times">
          <div className="time-item">
            <FaClock className="time-icon" />
            <span>Check-in {formatTime(hotel?.checkIn) || '14:00'}</span>
          </div>
          <div className="time-item">
            <FaClock className="time-icon" />
            <span>Check-out {formatTime(hotel?.checkOut) || '12:00'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HotelInfoCard;

