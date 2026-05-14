export function apiErrorMessage(err) {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object' && err.message) return err.message;
  return 'Đã xảy ra lỗi';
}

export function mergeRoomIntoList(prevRooms, roomId, data) {
  return prevRooms.map((r) =>
    String(r._id) === String(roomId) ? { ...r, roomEquipment: data.roomEquipment || [] } : r
  );
}
