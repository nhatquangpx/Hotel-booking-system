const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const guestRoutes = require("./routes/guestRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy để lấy IP address đúng khi deploy
app.set('trust proxy', true);

// Kết nối MongoDB
connectDB();

// CORS configuration - cho phép cả localhost, production và Vercel preview URLs
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean); // Loại bỏ undefined values

app.use(cors({
  origin: function (origin, callback) {
    // Cho phép requests không có origin (mobile apps, Postman, etc.)
    if (!origin) {
      return callback(null, true);
    }
    
    // Cho phép localhost và production URL từ env var
    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }
    
    // Cho phép tất cả Vercel URLs (production và preview)
    // Vercel URLs có format: *.vercel.app
    if (origin.endsWith('.vercel.app')) {
      return callback(null, true);
    }
    
    // Từ chối các origins khác
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API routes - Mount TRƯỚC static files để tránh conflicts
app.use("/api/auth", authRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);
app.use("/api/payment", paymentRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint (for testing)
app.get('/api', (req, res) => {
  res.json({ 
    message: 'API is running',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
        forgotPassword: 'POST /api/auth/forgotpassword'
      },
      guest: {
        hotels: 'GET /api/guest/hotels',
        featuredHotels: 'GET /api/guest/hotels/featured',
        hotelById: 'GET /api/guest/hotels/:id'
      }
    },
    timestamp: new Date().toISOString()
  });
});

// Static files - Mount SAU API routes
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(express.static('public'));

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found', path: req.path, method: req.method });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
