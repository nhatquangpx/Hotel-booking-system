export { apiErrorMessage } from '@/shared/utils/apiErrorMessage';

export function mergeRoomIntoList(prevRooms, roomId, data) {
  return prevRooms.map((r) =>
    String(r._id) === String(roomId) ? { ...r, roomEquipment: data.roomEquipment || [] } : r
  );
}
