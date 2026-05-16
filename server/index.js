const express = require("express");
const http = require("http");
const path = require('path');
const cron = require('node-cron');
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const guestRoutes = require("./routes/guestRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const staffRoutes = require("./routes/staffRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const { initializeSocket } = require("./socket/socketServer");
const { sendCheckInReminders } = require("./services/emails");
const { deactivateAllExpiredSales } = require("./services/sale/saleLifecycle");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// CORS allowed origins
const allowedOrigins = [
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean);

connectDB();

app.set('trust proxy', true);

app.use(cors({
  origin: function (origin, callback) {
    if (!origin) {
      return callback(null, true);
    }
    
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/auth", authRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/payment", paymentRoutes);

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));

app.use((req, res) => {
  res.status(404).json({ 
    message: 'Route not found', 
    path: req.path, 
    method: req.method 
  });
});

initializeSocket(server);

cron.schedule('0 9 * * *', async () => {
  console.log('Bắt đầu gửi email nhắc nhở check-in...');
  try {
    const results = await sendCheckInReminders();
    console.log(`Hoàn thành gửi email nhắc nhở: ${results.success}/${results.total} thành công`);
    if (results.errors.length > 0) {
      console.error('Các lỗi khi gửi email:', results.errors);
    }
  } catch (error) {
    console.error('Lỗi khi chạy scheduled job gửi email nhắc nhở:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Ho_Chi_Minh"
});

cron.schedule('5 0 * * *', async () => {
  console.log('Bắt đầu đồng bộ sale hết hạn...');
  try {
    const modifiedCount = await deactivateAllExpiredSales();
    console.log(`Đã tắt ${modifiedCount} chương trình sale hết hạn`);
  } catch (error) {
    console.error('Lỗi khi chạy scheduled job đồng bộ sale hết hạn:', error);
  }
}, {
  scheduled: true,
  timezone: "Asia/Ho_Chi_Minh"
});

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log('Scheduled job gửi email nhắc nhở check-in đã được kích hoạt (9:00 AM hàng ngày)');
  console.log('Scheduled job đồng bộ sale hết hạn đã được kích hoạt (00:05 AM hàng ngày, Asia/Ho_Chi_Minh)');
});
