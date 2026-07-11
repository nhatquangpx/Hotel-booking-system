/**
 * Shared helpers — seed / bổ sung trang thiết bị phòng.
 */
const Room = require("../models/Room");

const BASE_EQUIPMENT = [
  "Điều hòa",
  "TV",
  "Tủ lạnh mini",
  "Bình nước nóng",
  "Đèn phòng",
  "Ổ cắm điện",
  "Công tắc đèn",
  "Rèm cửa",
];

const TYPE_EXTRA_EQUIPMENT = {
  standard: ["Quạt trần", "Gương toàn thân"],
  deluxe: ["Két sắt", "Bàn làm việc", "Vòi sen", "Minibar"],
  suite: ["Két sắt", "Bồn tắm", "Minibar", "Máy pha cà phê", "Loa Bluetooth"],
  family: ["Giường phụ", "Két sắt", "Vòi sen", "Quạt đứng"],
  executive: ["Két sắt", "Bồn tắm", "Minibar", "Máy pha cà phê", "Bàn làm việc", "Loa Bluetooth"],
};

function pickStatus(roomIndex, itemIndex) {
  const roll = (roomIndex * 17 + itemIndex * 31) % 100;
  if (roll < 6) return "broken";
  if (roll < 16) return "under_repair";
  return "operational";
}

function buildEquipmentForRoom(room, roomIndex = 0) {
  const extras = TYPE_EXTRA_EQUIPMENT[room.type] || [];
  const names = [...BASE_EQUIPMENT, ...extras];

  return names.map((name, itemIndex) => ({
    name,
    status: pickStatus(roomIndex, itemIndex),
  }));
}

function mergeEquipment(existing, generated) {
  const existingNames = new Set(
    (existing || []).map((e) => (e.name || "").trim().toLowerCase())
  );
  const merged = [...(existing || [])];

  for (const item of generated) {
    const key = item.name.trim().toLowerCase();
    if (!existingNames.has(key)) {
      merged.push(item);
      existingNames.add(key);
    }
  }
  return merged;
}

/**
 * Gán / bổ sung thiết bị cho danh sách phòng (đã load +roomEquipment nếu cần merge).
 */
async function applyEquipmentToRooms(rooms, { force = false } = {}) {
  let updated = 0;
  let skipped = 0;
  let totalItems = 0;
  const statusCount = { operational: 0, under_repair: 0, broken: 0 };

  for (let i = 0; i < rooms.length; i += 1) {
    const room = rooms[i];
    const hasExisting = Array.isArray(room.roomEquipment) && room.roomEquipment.length > 0;

    if (hasExisting && !force) {
      skipped += 1;
      for (const eq of room.roomEquipment) {
        statusCount[eq.status] = (statusCount[eq.status] || 0) + 1;
        totalItems += 1;
      }
      continue;
    }

    const generated = buildEquipmentForRoom(room, i);
    room.roomEquipment = force ? generated : mergeEquipment(room.roomEquipment, generated);

    if (typeof room.save === "function") {
      await room.save();
    }

    updated += 1;
    totalItems += room.roomEquipment.length;
    for (const eq of room.roomEquipment) {
      statusCount[eq.status] = (statusCount[eq.status] || 0) + 1;
    }
  }

  return { updated, skipped, totalItems, statusCount, roomCount: rooms.length };
}

async function supplementEquipmentForHotels(hotels, { force = false } = {}) {
  const hotelIds = hotels.map((h) => h._id);
  const rooms = await Room.find({ hotelId: { $in: hotelIds } })
    .select("+roomEquipment")
    .sort({ hotelId: 1, roomNumber: 1 });

  return applyEquipmentToRooms(rooms, { force });
}

module.exports = {
  BASE_EQUIPMENT,
  TYPE_EXTRA_EQUIPMENT,
  buildEquipmentForRoom,
  mergeEquipment,
  applyEquipmentToRooms,
  supplementEquipmentForHotels,
};
