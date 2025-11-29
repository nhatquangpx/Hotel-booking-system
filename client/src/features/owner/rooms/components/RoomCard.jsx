import React from 'react';
import { FaBed, FaCheckCircle, FaExclamationCircle, FaClock, FaTools } from 'react-icons/fa';
import './RoomCard.scss';

/**
 * Room Card Component
 * Displays individual room information with status
 */
const RoomCard = ({ room, onClick }) => {
  const getBookingStatusConfig = (status) => {
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
      }
    };
    return statusMap[status] || statusMap['empty'];
  };

  const getRoomStatusConfig = (status) => {
    const statusMap = {
      'active': {
        label: 'Hoạt động',
        color: 'active'
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
    return statusMap[status] || statusMap['active'];
  };

  // Ưu tiên hiển thị bookingStatus, nếu không có thì fallback về roomStatus
  const bookingStatus = room.bookingStatus || (room.status && ['empty', 'occupied', 'pending'].includes(room.status) ? room.status : 'empty');
  const roomStatus = room.roomStatus || (room.status && ['active', 'maintenance', 'inactive'].includes(room.status) ? room.status : 'active');
  
  const bookingStatusConfig = getBookingStatusConfig(bookingStatus);
  const roomStatusConfig = getRoomStatusConfig(roomStatus);
  const IconComponent = bookingStatusConfig.icon;
  
  // Nếu roomStatus không phải active, hiển thị màu theo roomStatus
  const displayColor = roomStatus !== 'active' ? roomStatusConfig.color : bookingStatusConfig.color;

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
      className={`room-card room-card--${displayColor}`}
      onClick={onClick}
    >
      <div className="room-card__icon">
        <IconComponent />
      </div>
      <div className="room-card__content">
        <div className="room-card__number">{room.roomNumber || room.number}</div>
        <div className="room-card__status">{bookingStatusConfig.label}</div>
        {roomStatus !== 'active' && (
          <div className="room-card__room-status">{roomStatusConfig.label}</div>
        )}
        <div className="room-card__type">{formatRoomType(room.type)}</div>
        {(bookingStatus === 'occupied' || bookingStatus === 'pending') && room.guestName && (
          <div className="room-card__guest">{room.guestName}</div>
        )}
      </div>
    </div>
  );
};

export default RoomCard;

