import React from 'react';
import './RoomStatusLegend.scss';

/**
 * Room Status Legend Component
 * Displays color-coded legend for room statuses
 */
const RoomStatusLegend = () => {
  const statuses = [
    { key: 'empty', label: 'Trống', color: 'empty' },
    { key: 'occupied', label: 'Đang ở', color: 'occupied' },
    { key: 'pending', label: 'Chờ nhận', color: 'pending' },
    { key: 'cleaning', label: 'Cần dọn', color: 'cleaning' },
    { key: 'maintenance', label: 'Bảo trì', color: 'maintenance' }
  ];

  return (
    <div className="room-status-legend">
      {statuses.map((status) => (
        <div key={status.key} className="room-status-legend__item">
          <div className={`room-status-legend__color room-status-legend__color--${status.color}`}></div>
          <span className="room-status-legend__label">{status.label}</span>
        </div>
      ))}
    </div>
  );
};

export default RoomStatusLegend;

