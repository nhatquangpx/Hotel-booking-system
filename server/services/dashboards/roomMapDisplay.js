const BOOKING_STATUS_LABELS = {
  empty: "Trống",
  occupied: "Đang ở",
  pending: "Chờ nhận",
};

const ROOM_STATUS_LABELS = {
  active: "Hoạt động",
  maintenance: "Bảo trì",
  inactive: "Tạm ngưng",
};

function getRoomMapDisplayStatus(room) {
  const bookingStatus = room?.bookingStatus || "empty";
  const roomStatus = room?.roomStatus || "active";
  const displayColor = roomStatus !== "active" ? roomStatus : bookingStatus;
  const label = BOOKING_STATUS_LABELS[bookingStatus] || "Trống";
  const secondaryLabel =
    roomStatus !== "active" ? ROOM_STATUS_LABELS[roomStatus] || roomStatus : null;

  return { bookingStatus, roomStatus, displayColor, label, secondaryLabel };
}

function roomNeedsDashboardAttention(room) {
  const { roomStatus, bookingStatus } = getRoomMapDisplayStatus(room);
  return roomStatus !== "active" || bookingStatus !== "empty";
}

function roomAttentionPriority(room) {
  const { roomStatus, bookingStatus } = getRoomMapDisplayStatus(room);
  if (roomStatus === "maintenance") return 0;
  if (roomStatus === "inactive") return 1;
  if (bookingStatus === "occupied") return 2;
  if (bookingStatus === "pending") return 3;
  return 4;
}

module.exports = {
  getRoomMapDisplayStatus,
  roomNeedsDashboardAttention,
  roomAttentionPriority,
};
