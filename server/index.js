const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const guestRoutes = require("./routes/guestRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Kết nối MongoDB
connectDB();

// Request logging middleware - ĐẶT ĐẦU TIÊN để log TẤT CẢ requests
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  console.log(`  Origin: ${req.headers.origin || 'none'}`);
  console.log(`  User-Agent: ${req.headers['user-agent']?.substring(0, 50) || 'none'}`);
  next();
});

// CORS configuration - cho phép cả localhost, production và Vercel preview URLs
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean); // Loại bỏ undefined values

app.use(cors({
  origin: function (origin, callback) {
    console.log(`CORS check - Origin: ${origin || 'none'}`);
    
    // Cho phép requests không có origin (mobile apps, Postman, etc.)
    if (!origin) {
      console.log('  -> Allowed (no origin)');
      return callback(null, true);
    }
    
    // Cho phép localhost và production URL từ env var
    if (allowedOrigins.indexOf(origin) !== -1) {
      console.log(`  -> Allowed (in allowedOrigins)`);
      return callback(null, true);
    }
    
    // Cho phép tất cả Vercel URLs (production và preview)
    // Vercel URLs có format: *.vercel.app
    if (origin.endsWith('.vercel.app')) {
      console.log(`  -> Allowed (Vercel domain)`);
      return callback(null, true);
    }
    
    // Từ chối các origins khác
    console.log(`  -> Blocked (not allowed)`);
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
