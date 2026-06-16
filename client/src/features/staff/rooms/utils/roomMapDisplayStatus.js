/** Nhãn trạng thái đặt phòng — khớp RoomCard / RoomStatusLegend */
const BOOKING_STATUS_LABELS = {
  empty: 'Trống',
  occupied: 'Đang ở',
  pending: 'Chờ nhận',
};

/** Nhãn trạng thái phòng vận hành */
const ROOM_STATUS_LABELS = {
  active: 'Hoạt động',
  maintenance: 'Bảo trì',
  inactive: 'Tạm ngưng',
};

/**
 * Trạng thái hiển thị trên sơ đồ phòng (RoomCard):
 * - Màu: roomStatus nếu không active, ngược lại theo bookingStatus
 * - Chữ trên thẻ: nhãn bookingStatus; thêm dòng phụ nếu roomStatus !== active
 */
export function getRoomMapDisplayStatus(room) {
  const bookingStatus = room?.bookingStatus || 'empty';
  const roomStatus = room?.roomStatus || 'active';

  const displayColor = roomStatus !== 'active' ? roomStatus : bookingStatus;
  const label = BOOKING_STATUS_LABELS[bookingStatus] || 'Trống';
  const secondaryLabel =
    roomStatus !== 'active' ? ROOM_STATUS_LABELS[roomStatus] || roomStatus : null;

  return {
    bookingStatus,
    roomStatus,
    displayColor,
    label,
    secondaryLabel,
  };
}

export function roomNeedsDashboardAttention(room) {
  const { roomStatus, bookingStatus } = getRoomMapDisplayStatus(room);
  return roomStatus !== 'active' || bookingStatus !== 'empty';
}
