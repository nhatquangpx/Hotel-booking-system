/**
 * Reset toàn bộ DB rồi seed lại dữ liệu mẫu.
 * Chạy: node scripts/reseedDatabase.js
 */
require("dotenv").config({ path: require("path").join(__dirname, "../.env") });
const mongoose = require("mongoose");
const { seedDatabase } = require("./seedDatabase");

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

async function clearAll() {
  const db = mongoose.connection.db;
  const existing = await db.listCollections().toArray();
  const existingNames = new Set(existing.map((c) => c.name));

  for (const name of COLLECTIONS) {
    if (existingNames.has(name)) {
      const result = await db.collection(name).deleteMany({});
      console.log(`  ✓ ${name}: đã xóa ${result.deletedCount} document`);
    }
  }
}

async function reseed() {
  if (!process.env.MONGO_URL) {
    console.error("Thiếu MONGO_URL trong file .env");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGO_URL, { dbName: "StayJourney" });
    console.log("Đã kết nối MongoDB (StayJourney)\n--- Bước 1: Xóa dữ liệu cũ ---");
    await clearAll();
    await mongoose.disconnect();

    console.log("\n--- Bước 2: Seed dữ liệu mới ---");
    await seedDatabase();
  } catch (err) {
    console.error("Lỗi reseed:", err);
    process.exit(1);
  }
}

reseed();
