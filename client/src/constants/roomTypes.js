/** Enum loại phòng (khớp Room.type trên server) */
export const ROOM_TYPES = ['standard', 'deluxe', 'suite', 'family', 'executive'];

/** Nhãn tiếng Việt thống nhất cho mọi role */
export const ROOM_TYPE_LABELS = {
  standard: 'Phòng tiêu chuẩn',
  deluxe: 'Phòng cao cấp',
  suite: 'Phòng Suite',
  family: 'Phòng gia đình',
  executive: 'Phòng hạng sang',
};

export const ROOM_TYPE_OPTIONS = ROOM_TYPES.map((value) => ({
  value,
  label: ROOM_TYPE_LABELS[value],
}));

export function formatRoomType(type) {
  if (!type) return '—';
  return ROOM_TYPE_LABELS[type] || type;
}
