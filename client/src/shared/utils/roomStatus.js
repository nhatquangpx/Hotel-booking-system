/** Nhãn trạng thái vận hành phòng (roomStatus). */
export const ROOM_STATUS_LABELS = {
  active: 'Hoạt động',
  maintenance: 'Bảo trì',
  inactive: 'Tạm ngưng',
};

/** Nhãn trạng thái đặt phòng (bookingStatus). */
export const BOOKING_STATUS_LABELS = {
  empty: 'Trống',
  occupied: 'Đang ở',
  pending: 'Chờ nhận',
};

function withNormalizedStatus(room, roomStatus, bookingStatus) {
  return {
    ...room,
    roomStatus,
    bookingStatus,
  };
}

/** Chuẩn hóa roomStatus / bookingStatus từ API. */
export function normalizeRoomStatus(room) {
  if (!room) {
    return { roomStatus: 'active', bookingStatus: 'empty' };
  }

  return withNormalizedStatus(
    room,
    room.roomStatus || 'active',
    room.bookingStatus || 'empty'
  );
}

export function getRoomStatusLabel(roomStatus) {
  return ROOM_STATUS_LABELS[roomStatus] || roomStatus || '—';
}

export function getBookingStatusLabel(bookingStatus) {
  return BOOKING_STATUS_LABELS[bookingStatus] || bookingStatus || '—';
}

export function sortRoomsByNumber(rooms) {
  return [...rooms].sort((a, b) => {
    const roomNumberA = a.roomNumber || '';
    const roomNumberB = b.roomNumber || '';
    const numA = parseInt(roomNumberA, 10) || 0;
    const numB = parseInt(roomNumberB, 10) || 0;
    if (numA !== numB) return numA - numB;
    return roomNumberA.localeCompare(roomNumberB);
  });
}
