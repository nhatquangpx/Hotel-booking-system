import React from 'react';
import './RoomStatusLegend.scss';

/**
 * Room Status Legend Component
 * Displays color-coded legend for room statuses
 */
const RoomStatusLegend = () => {
  const roomStatuses = [
    { key: 'active', label: 'Hoạt động', color: 'active' },
    { key: 'maintenance', label: 'Bảo trì', color: 'maintenance' },
    { key: 'inactive', label: 'Tạm ngưng', color: 'inactive' }
  ];

  const bookingStatuses = [
    { key: 'empty', label: 'Trống', color: 'empty' },
    { key: 'occupied', label: 'Đang ở', color: 'occupied' },
    { key: 'pending', label: 'Chờ nhận', color: 'pending' }
  ];

  return (
    <div className="room-status-legend">
      <div className="room-status-legend__column">
        <div className="room-status-legend__title">Trạng thái phòng</div>
        <div className="room-status-legend__items">
          {roomStatuses.map((status) => (
            <div key={status.key} className="room-status-legend__item">
              <div className={`room-status-legend__color room-status-legend__color--${status.color}`}></div>
              <span className="room-status-legend__label">{status.label}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="room-status-legend__column">
        <div className="room-status-legend__title">Trạng thái đặt phòng</div>
        <div className="room-status-legend__items">
          {bookingStatuses.map((status) => (
            <div key={status.key} className="room-status-legend__item">
              <div className={`room-status-legend__color room-status-legend__color--${status.color}`}></div>
              <span className="room-status-legend__label">{status.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RoomStatusLegend;

