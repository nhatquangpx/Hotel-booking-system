/**
 * Bổ sung trang thiết bị (roomEquipment) cho tất cả phòng
 * thuộc khách sạn test "Sunrise Resort Nẵng".
 *
 * Chạy: npm run db:supplement-equipment
 * Ghi đè toàn bộ thiết bị cũ: npm run db:supplement-equipment -- --force
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const Hotel = require("../models/Hotel");
const Room = require("../models/Room");

const TARGET_HOTEL_NAME = "Sunrise Resort Nẵng";

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

function buildEquipmentForRoom(room, roomIndex) {
  const extras = TYPE_EXTRA_EQUIPMENT[room.type] || [];
  const names = [...BASE_EQUIPMENT, ...extras];

  return names.map((name, itemIndex) => ({
    name,
    status: pickStatus(roomIndex, itemIndex),
  }));
}

async function findTargetHotel() {
  const hotel = await Hotel.findOne({ name: TARGET_HOTEL_NAME });
  if (hotel) return hotel;

  const fuzzy = await Hotel.findOne({ name: { $regex: /Sunrise Resort.*Nẵng/i } });
  if (fuzzy) return fuzzy;

  throw new Error(`Không tìm thấy khách sạn "${TARGET_HOTEL_NAME}" trong DB.`);
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

async function supplementRoomEquipment({ force = false } = {}) {
  const hotel = await findTargetHotel();
  const rooms = await Room.find({ hotelId: hotel._id })
    .select("+roomEquipment")
    .sort({ roomNumber: 1 });

  if (rooms.length === 0) {
    throw new Error(`Khách sạn "${hotel.name}" chưa có phòng.`);
  }

  let updated = 0;
  let skipped = 0;
  let totalItems = 0;
  const statusCount = { operational: 0, under_repair: 0, broken: 0 };

  for (let i = 0; i < rooms.length; i += 1) {
    const room = rooms[i];
    const hasExisting = Array.isArray(room.roomEquipment) && room.roomEquipment.length > 0;

    if (hasExisting && !force) {
      skipped += 1;
      continue;
    }

    const generated = buildEquipmentForRoom(room, i);
    room.roomEquipment = force ? generated : mergeEquipment(room.roomEquipment, generated);
    await room.save();

    updated += 1;
    totalItems += room.roomEquipment.length;
    for (const eq of room.roomEquipment) {
      statusCount[eq.status] = (statusCount[eq.status] || 0) + 1;
    }
  }

  return {
    hotel,
    roomCount: rooms.length,
    updated,
    skipped,
    totalItems,
    statusCount,
  };
}

async function main() {
  const force = process.argv.includes("--force");

  if (!process.env.MONGO_URL) {
    console.error("Thiếu MONGO_URL trong file .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URL, { dbName: "StayJourney" });
    console.log("Đã kết nối MongoDB (StayJourney)");
    console.log(`Chế độ: ${force ? "ghi đè (--force)" : "bổ sung (giữ thiết bị cũ)"}\n`);

    const result = await supplementRoomEquipment({ force });

    console.log(`Khách sạn: ${result.hotel.name} (${result.hotel._id})`);
    console.log(`  ✓ Tổng phòng: ${result.roomCount}`);
    console.log(`  ✓ Đã cập nhật: ${result.updated}`);
    console.log(`  - Bỏ qua (đã có thiết bị): ${result.skipped}`);
    console.log(`  ✓ Tổng thiết bị sau cập nhật: ${result.totalItems}`);
    console.log("  Trạng thái thiết bị:");
    console.log(`    - Hoạt động bình thường: ${result.statusCount.operational || 0}`);
    console.log(`    - Đang sửa chữa: ${result.statusCount.under_repair || 0}`);
    console.log(`    - Hỏng: ${result.statusCount.broken || 0}`);
    console.log("\n=== Hoàn tất ===");
  } catch (err) {
    console.error("Lỗi bổ sung thiết bị:", err.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

module.exports = { supplementRoomEquipment, findTargetHotel, buildEquipmentForRoom };

if (require.main === module) {
  main();
}
