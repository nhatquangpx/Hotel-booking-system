const express = require("express");
const path = require("path");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const { csrfProtection } = require("./middlewares/csrfProtection");

const authRoutes = require("./routes/authRoutes");
const guestRoutes = require("./routes/guestRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ownerRoutes = require("./routes/ownerRoutes");
const staffRoutes = require("./routes/staffRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const allowedOrigins = [
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

function createApp() {
  const app = express();

  app.set("trust proxy", true);

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) return callback(null, true);
        if (origin.endsWith(".vercel.app")) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "X-CSRF-Token"],
      preflightContinue: false,
      optionsSuccessStatus: 204,
    })
  );

  app.use(cookieParser());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(csrfProtection);

  app.use("/api/auth", authRoutes);
  app.use("/api/guest", guestRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/owner", ownerRoutes);
  app.use("/api/staff", staffRoutes);
  app.use("/api/payment", paymentRoutes);

  app.get("/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      env: process.env.NODE_ENV || "development",
    });
  });

  app.use("/public-uploads", express.static(path.join(__dirname, "public-uploads")));
  // Giữ alias /uploads cho URL cũ trong DB (trước khi đổi tên thư mục)
  app.use("/uploads", express.static(path.join(__dirname, "public-uploads")));

  app.use((req, res) => {
    res.status(404).json({
      message: "Route not found",
      path: req.path,
      method: req.method,
    });
  });

  return app;
}

module.exports = { createApp };
