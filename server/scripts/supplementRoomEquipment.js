/**
 * Bổ sung trang thiết bị (roomEquipment) cho phòng khách sạn.
 *
 * Mặc định: tất cả khách sạn.
 * Chỉ 1 KS: npm run db:supplement-equipment -- --hotel "Silver Resort Nha Trang"
 * Ghi đè: thêm --force
 *
 * Chạy: npm run db:supplement-equipment
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const Hotel = require("../models/Hotel");
const {
  buildEquipmentForRoom,
  supplementEquipmentForHotels,
} = require("./roomEquipmentSeed");

const DEFAULT_FOCUS_HOTEL = "Silver Resort Nha Trang";

function getArgValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx === -1 || idx + 1 >= process.argv.length) return null;
  return process.argv[idx + 1];
}

async function findHotels({ hotelName } = {}) {
  if (hotelName) {
    let hotel = await Hotel.findOne({ name: hotelName });
    if (!hotel) {
      hotel = await Hotel.findOne({
        name: { $regex: new RegExp(hotelName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      });
    }
    if (!hotel) {
      throw new Error(`Không tìm thấy khách sạn "${hotelName}" trong DB.`);
    }
    return [hotel];
  }
  return Hotel.find().sort({ name: 1 });
}

async function supplementRoomEquipment({ force = false, hotelName = null } = {}) {
  const hotels = await findHotels({ hotelName });
  if (hotels.length === 0) {
    throw new Error("Không có khách sạn nào trong DB.");
  }

  const result = await supplementEquipmentForHotels(hotels, { force });
  return { hotels, ...result };
}

async function main() {
  const force = process.argv.includes("--force");
  const hotelName = getArgValue("--hotel");

  if (!process.env.MONGO_URL) {
    console.error("Thiếu MONGO_URL trong file .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URL, { dbName: "StayJourney" });
    console.log("Đã kết nối MongoDB (StayJourney)");
    console.log(
      `Chế độ: ${force ? "ghi đè (--force)" : "bổ sung (giữ thiết bị cũ)"} | Phạm vi: ${
        hotelName || "tất cả khách sạn"
      }\n`
    );

    const result = await supplementRoomEquipment({ force, hotelName });

    console.log(`Khách sạn: ${result.hotels.length}`);
    if (result.hotels.length <= 5) {
      for (const h of result.hotels) {
        console.log(`  - ${h.name} (${h._id})`);
      }
    }
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

module.exports = {
  supplementRoomEquipment,
  findHotels,
  buildEquipmentForRoom,
  DEFAULT_FOCUS_HOTEL,
};

if (require.main === module) {
  main();
}
