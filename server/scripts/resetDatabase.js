/**
 * Xóa toàn bộ dữ liệu trong database StayJourney.
 * Chạy: node scripts/resetDatabase.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");

const COLLECTIONS = [
  "users",
  "hotels",
  "rooms",
  "bookings",
  "paymenttransactions",
  "reviews",
  "salepromotions",
  "contactmessages",
  "notifications",
];

async function resetDatabase() {
  if (!process.env.MONGO_URL) {
    console.error("Thiếu MONGO_URL trong file .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URL, { dbName: "StayJourney" });
    console.log("Đã kết nối MongoDB (StayJourney)");

    const db = mongoose.connection.db;
    const existing = await db.listCollections().toArray();
    const existingNames = new Set(existing.map((c) => c.name));

    for (const name of COLLECTIONS) {
      if (existingNames.has(name)) {
        const result = await db.collection(name).deleteMany({});
        console.log(`  ✓ ${name}: đã xóa ${result.deletedCount} document`);
      } else {
        console.log(`  - ${name}: collection chưa tồn tại, bỏ qua`);
      }
    }

    console.log("\nHoàn tất xóa dữ liệu.");
  } catch (err) {
    console.error("Lỗi reset database:", err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

resetDatabase();
