const http = require("http");
const cron = require("node-cron");
require("dotenv").config();

const connectDB = require("./config/db");
const { createApp } = require("./app");
const { initializeSocket } = require("./socket/socketServer");
const { sendCheckInReminders } = require("./services/emails");
const { deactivateAllExpiredSales } = require("./services/sale/saleLifecycle");
const { cancelExpiredPendingBookings } = require("./services/bookings/pendingExpiry");

const app = createApp();
const server = http.createServer(app);
const PORT = process.env.PORT || 8001;

connectDB();

initializeSocket(server);

cron.schedule(
  "0 9 * * *",
  async () => {
    console.log("Bắt đầu gửi email nhắc nhở check-in...");
    try {
      const results = await sendCheckInReminders();
      console.log(
        `Hoàn thành gửi email nhắc nhở: ${results.success}/${results.total} thành công`
      );
      if (results.errors.length > 0) {
        console.error("Các lỗi khi gửi email:", results.errors);
      }
    } catch (error) {
      console.error("Lỗi khi chạy scheduled job gửi email nhắc nhở:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);

cron.schedule(
  "5 0 * * *",
  async () => {
    console.log("Bắt đầu đồng bộ sale hết hạn...");
    try {
      const modifiedCount = await deactivateAllExpiredSales();
      console.log(`Đã tắt ${modifiedCount} chương trình sale hết hạn`);
    } catch (error) {
      console.error("Lỗi khi chạy scheduled job đồng bộ sale hết hạn:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);

cron.schedule(
  "*/5 * * * *",
  async () => {
    try {
      const { cancelled } = await cancelExpiredPendingBookings();
      if (cancelled > 0) {
        console.log(`Đã tự hủy ${cancelled} đơn pending quá hạn giữ phòng`);
      }
    } catch (error) {
      console.error("Lỗi khi hủy đơn pending quá hạn:", error);
    }
  },
  {
    scheduled: true,
    timezone: "Asia/Ho_Chi_Minh",
  }
);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    "Scheduled job gửi email nhắc nhở check-in đã được kích hoạt (9:00 AM hàng ngày)"
  );
  console.log(
    "Scheduled job đồng bộ sale hết hạn đã được kích hoạt (00:05 AM hàng ngày, Asia/Ho_Chi_Minh)"
  );
  console.log(
    "Scheduled job hủy đơn pending quá hạn đã được kích hoạt (mỗi 5 phút, Asia/Ho_Chi_Minh)"
  );
});
