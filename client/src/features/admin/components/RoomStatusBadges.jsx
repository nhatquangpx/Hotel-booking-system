import React from 'react';
import {
  normalizeRoomStatus,
  getRoomStatusLabel,
  getBookingStatusLabel,
} from '@/shared/utils/roomStatus';

/**
 * Hiển thị roomStatus (+ bookingStatus khi không trống) cho admin.
 */
const RoomStatusBadges = ({ room, showBookingWhenEmpty = false }) => {
  const { roomStatus, bookingStatus } = normalizeRoomStatus(room);

  return (
    <div className="room-status-badges">
      <span className={`status-badge ${roomStatus}`}>
        {getRoomStatusLabel(roomStatus)}
      </span>
      {(showBookingWhenEmpty || bookingStatus !== 'empty') && (
        <span className={`status-badge booking-${bookingStatus}`}>
          {getBookingStatusLabel(bookingStatus)}
        </span>
      )}
    </div>
  );
};

export default RoomStatusBadges;
