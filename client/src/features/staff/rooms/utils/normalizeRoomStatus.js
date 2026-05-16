/** Chuẩn hóa roomStatus / bookingStatus từ dữ liệu API (tương thích legacy). */
export function normalizeRoomStatus(room) {
  if (room.roomStatus && room.bookingStatus) {
    return {
      ...room,
      roomStatus: room.roomStatus,
      bookingStatus: room.bookingStatus,
    };
  }

  if (room.status) {
    if (['empty', 'occupied', 'pending'].includes(room.status)) {
      return {
        ...room,
        bookingStatus: room.status,
        roomStatus: 'active',
      };
    }
    if (['maintenance', 'inactive'].includes(room.status)) {
      return {
        ...room,
        bookingStatus: 'empty',
        roomStatus: room.status,
      };
    }
  }

  if (room.available === false) {
    return {
      ...room,
      bookingStatus: 'empty',
      roomStatus: 'maintenance',
    };
  }

  return {
    ...room,
    bookingStatus: room.bookingStatus || 'empty',
    roomStatus: room.roomStatus || 'active',
  };
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
