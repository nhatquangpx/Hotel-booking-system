import React, { useState, useEffect } from 'react';
import { FaTimes, FaEdit, FaWifi, FaSnowflake, FaTv, FaWineBottle, FaHistory, FaSyncAlt, FaTrash } from 'react-icons/fa';
import { UpdateRoomStatusDialog } from './index';
import api from '@/apis';
import './RoomDetailModal.scss';

/**
 * Room Detail Modal Component
 * Displays detailed information about a room with tabs for Information and Actions
 */
const RoomDetailModal = ({ room, isOpen, onClose, onEdit, onStatusUpdate }) => {
  const [roomDetails, setRoomDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);

  useEffect(() => {
    if (isOpen && room?._id) {
      fetchRoomDetails();
    }
  }, [isOpen, room]);

  const fetchRoomDetails = async () => {
    try {
      setLoading(true);
      const details = await api.ownerRoom.getRoomById(room._id);
      setRoomDetails(details);
    } catch (error) {
      console.error('Error fetching room details:', error);
      // Fallback to room prop if API fails
      setRoomDetails(room);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const roomData = roomDetails || room;
  if (!roomData) return null;

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

  const formatStatus = (status) => {
    const statusMap = {
      'empty': 'Trống',
      'occupied': 'Đang ở',
      'pending': 'Chờ nhận',
      'maintenance': 'Bảo trì',
      'inactive': 'Tạm ngưng'
    };
    return statusMap[status] || status || 'Trống';
  };

  const formatPrice = (price) => {
    if (!price) return '0 VND';
    const regularPrice = price.regular || price || 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(regularPrice);
  };

  const getFacilityIcon = (facility) => {
    const facilityLower = facility?.toLowerCase() || '';
    if (facilityLower.includes('wifi')) return FaWifi;
    if (facilityLower.includes('điều hòa') || facilityLower.includes('air')) return FaSnowflake;
    if (facilityLower.includes('tv')) return FaTv;
    if (facilityLower.includes('minibar') || facilityLower.includes('bar')) return FaWineBottle;
    return null;
  };

  const formatFacility = (facility) => {
    const facilityMap = {
      'wifi': 'Wifi miễn phí',
      'air conditioning': 'Điều hòa',
      'tv': 'TV',
      'minibar': 'Minibar'
    };
    return facilityMap[facility?.toLowerCase()] || facility || '';
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(roomData);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const handleViewHistory = () => {
    // Navigate to booking history
    console.log('View booking history for room:', roomData);
  };

  const handleUpdateStatus = () => {
    setIsStatusDialogOpen(true);
  };

  const handleCloseStatusDialog = () => {
    setIsStatusDialogOpen(false);
  };

  const handleStatusUpdateSuccess = () => {
    fetchRoomDetails();
    onStatusUpdate?.();
  };

  const handleDeleteRoom = () => {
    // Confirm and delete room
    if (window.confirm(`Bạn có chắc chắn muốn xóa phòng ${roomData.roomNumber}?`)) {
      console.log('Delete room:', roomData);
    }
  };

  return (
    <div className="room-detail-modal-overlay" onClick={handleBackdropClick}>
      <div className="room-detail-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="room-detail-modal__header">
          <div className="room-detail-modal__header-top">
            <h2 className="room-detail-modal__title">Phòng {roomData.roomNumber}</h2>
            <button 
              className="room-detail-modal__close-btn"
              onClick={onClose}
              title="Đóng"
            >
              <FaTimes />
            </button>
          </div>
          <div className="room-detail-modal__header-actions">
            <button 
              className="room-detail-modal__action-btn-header"
              onClick={handleViewHistory}
              title="Xem lịch sử đặt phòng"
            >
              <FaHistory />
              <span>Lịch sử</span>
            </button>
            <button 
              className="room-detail-modal__action-btn-header"
              onClick={handleUpdateStatus}
              title="Cập nhật trạng thái"
            >
              <FaSyncAlt />
              <span>Cập nhật trạng thái</span>
            </button>
            <button 
              className="room-detail-modal__edit-btn"
              onClick={handleEdit}
              title="Chỉnh sửa"
            >
              <FaEdit />
              <span>Chỉnh sửa</span>
            </button>
            <button 
              className="room-detail-modal__action-btn-header room-detail-modal__action-btn-header--danger"
              onClick={handleDeleteRoom}
              title="Xóa phòng"
            >
              <FaTrash />
              <span>Xóa phòng</span>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="room-detail-modal__content">
          {loading ? (
            <div className="room-detail-modal__loading">
              <div className="loading-spinner"></div>
              <p>Đang tải thông tin phòng...</p>
            </div>
          ) : (
            <div className="room-detail-modal__info">
              {/* Room Image */}
              {roomData.images && roomData.images.length > 0 ? (
                <div className="room-detail-modal__image">
                  <img 
                    src={roomData.images[0]} 
                    alt={`Phòng ${roomData.roomNumber}`}
                    onError={(e) => {
                      e.target.src = 'https://via.placeholder.com/400x300?text=Room+Image';
                    }}
                  />
                </div>
              ) : (
                <div className="room-detail-modal__image room-detail-modal__image--placeholder">
                  <div className="placeholder-content">
                    <span>Không có hình ảnh</span>
                  </div>
                </div>
              )}

              {/* Room Details */}
              <div className="room-detail-modal__details">
                <div className="room-detail-modal__detail-item">
                  <span className="room-detail-modal__detail-label">Loại phòng:</span>
                  <span className="room-detail-modal__detail-value">
                    {formatRoomType(roomData.type)}
                  </span>
                </div>

                <div className="room-detail-modal__detail-item">
                  <span className="room-detail-modal__detail-label">Trạng thái:</span>
                  <span className="room-detail-modal__detail-value">
                    {formatStatus(roomData.status)}
                  </span>
                </div>

                <div className="room-detail-modal__detail-item">
                  <span className="room-detail-modal__detail-label">Giá phòng:</span>
                  <span className="room-detail-modal__detail-value">
                    {formatPrice(roomData.price)}
                  </span>
                </div>

                <div className="room-detail-modal__detail-item">
                  <span className="room-detail-modal__detail-label">Số khách:</span>
                  <span className="room-detail-modal__detail-value">
                    Tối đa {roomData.maxPeople || 2} người
                  </span>
                </div>

                {roomData.description && (
                  <div className="room-detail-modal__description">
                    <h3 className="room-detail-modal__section-title">Mô tả</h3>
                    <p className="room-detail-modal__description-text">
                      {roomData.description}
                    </p>
                  </div>
                )}

                {roomData.facilities && roomData.facilities.length > 0 && (
                  <div className="room-detail-modal__facilities">
                    <h3 className="room-detail-modal__section-title">Tiện nghi</h3>
                    <div className="room-detail-modal__facilities-list">
                      {roomData.facilities.map((facility, index) => {
                        const IconComponent = getFacilityIcon(facility);
                        return (
                          <div key={index} className="room-detail-modal__facility-tag">
                            {IconComponent && <IconComponent />}
                            <span>{formatFacility(facility)}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {roomData.guestName && (
                  <div className="room-detail-modal__customer">
                    <h3 className="room-detail-modal__section-title">Khách hàng</h3>
                    <p className="room-detail-modal__customer-name">{roomData.guestName}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <UpdateRoomStatusDialog
        room={roomDetails || room}
        isOpen={isStatusDialogOpen}
        onClose={handleCloseStatusDialog}
        onSuccess={handleStatusUpdateSuccess}
      />
    </div>
  );
};

export default RoomDetailModal;

