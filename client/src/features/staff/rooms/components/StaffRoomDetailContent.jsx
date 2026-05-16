import React from 'react';
import {
  formatRoomType,
  formatRoomStatus,
  formatBookingStatus,
  formatPrice,
} from './roomDetailFormatters';

const StaffRoomDetailContent = ({ roomData, loading }) => {
  if (loading) {
    return (
      <div className="room-detail-modal__loading">
        <div className="loading-spinner" />
        <p>Đang tải thông tin phòng...</p>
      </div>
    );
  }

  if (!roomData) return null;

  return (
    <div className="room-detail-modal__info">
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

      <div className="room-detail-modal__details">
        <div className="room-detail-modal__detail-item">
          <span className="room-detail-modal__detail-label">Loại phòng:</span>
          <span className="room-detail-modal__detail-value">{formatRoomType(roomData.type)}</span>
        </div>

        <div className="room-detail-modal__status-section">
          <h3 className="room-detail-modal__section-title">Trạng thái</h3>
          <div className="room-detail-modal__status-grid">
            <div className="room-detail-modal__status-column">
              <div className="room-detail-modal__status-label">Trạng thái phòng</div>
              <div className="room-detail-modal__status-value">
                {formatRoomStatus(roomData.roomStatus)}
              </div>
            </div>
            <div className="room-detail-modal__status-column">
              <div className="room-detail-modal__status-label">Trạng thái đặt phòng</div>
              <div className="room-detail-modal__status-value">
                {formatBookingStatus(roomData.bookingStatus)}
              </div>
            </div>
          </div>
        </div>

        <div className="room-detail-modal__detail-item">
          <span className="room-detail-modal__detail-label">Giá phòng:</span>
          <span className="room-detail-modal__detail-value">{formatPrice(roomData.price)}</span>
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
            <p className="room-detail-modal__description-text">{roomData.description}</p>
          </div>
        )}

        {roomData.facilities && roomData.facilities.length > 0 && (
          <div className="room-detail-modal__facilities">
            <h3 className="room-detail-modal__section-title">Tiện nghi</h3>
            <div className="room-detail-modal__facilities-list">
              {roomData.facilities.map((facility, index) => (
                <span key={index} className="room-detail-modal__facility-tag">
                  {facility}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffRoomDetailContent;
