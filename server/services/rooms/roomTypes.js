/** Enum loại phòng (khớp Room.type) */
const ROOM_TYPES = ["standard", "deluxe", "suite", "family", "executive"];

/** Nhãn tiếng Việt thống nhất (khớp client/src/constants/roomTypes.js) */
const ROOM_TYPE_LABEL_VI = {
  standard: "Phòng tiêu chuẩn",
  deluxe: "Phòng cao cấp",
  suite: "Phòng Suite",
  family: "Phòng gia đình",
  executive: "Phòng hạng sang",
};

const ROOM_TYPE_ORDER = [...ROOM_TYPES];

function formatRoomTypeVi(type) {
  if (!type) return "—";
  return ROOM_TYPE_LABEL_VI[type] || type;
}

module.exports = {
  ROOM_TYPES,
  ROOM_TYPE_ORDER,
  ROOM_TYPE_LABEL_VI,
  formatRoomTypeVi,
};
