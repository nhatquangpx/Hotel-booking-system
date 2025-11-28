import React from 'react';
import { FaBed, FaCheckCircle, FaExclamationCircle, FaClock, FaTools } from 'react-icons/fa';
import './RoomCard.scss';

/**
 * Room Card Component
 * Displays individual room information with status
 */
const RoomCard = ({ room, onClick }) => {
  const getStatusConfig = (status) => {
    const statusMap = {
      'empty': {
        label: 'Trống',
        color: 'empty',
        icon: FaCheckCircle
      },
      'occupied': {
        label: 'Đang ở',
        color: 'occupied',
        icon: FaBed
      },
      'pending': {
        label: 'Chờ nhận',
        color: 'pending',
        icon: FaClock
      },
      'maintenance': {
        label: 'Bảo trì',
        color: 'maintenance',
        icon: FaTools
      },
      'inactive': {
        label: 'Tạm ngưng',
        color: 'inactive',
        icon: FaTools
      }
    };
    return statusMap[status] || statusMap['empty'];
  };

  const statusConfig = getStatusConfig(room.status || 'empty');
  const IconComponent = statusConfig.icon;

  const formatRoomType = (type) => {
    const typeMap = {
      'standard': 'Phòng Standard',
      'deluxe': 'Phòng Deluxe',
      'suite': 'Phòng Suite',
      'family': 'Phòng gia đình',
      'executive': 'Phòng hạng sang'
    };
    return typeMap[type] || type || 'Phòng';
  };

  return (
    <div 
      className={`room-card room-card--${statusConfig.color}`}
      onClick={onClick}
    >
      <div className="room-card__icon">
        <IconComponent />
      </div>
      <div className="room-card__content">
        <div className="room-card__number">{room.roomNumber || room.number}</div>
        <div className="room-card__status">{statusConfig.label}</div>
        <div className="room-card__type">{formatRoomType(room.type)}</div>
        {(room.status === 'occupied' || room.status === 'pending') && room.guestName && (
          <div className="room-card__guest">{room.guestName}</div>
        )}
      </div>
    </div>
  );
};

export default RoomCard;

