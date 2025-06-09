const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const guestRoutes = require("./routes/guestRoutes");
const adminRoutes = require("./routes/adminRoutes");
const ownerRoutes = require("./routes/ownerRoutes");

const app = express();
const PORT = process.env.PORT;

// Kết nối MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

// General routes
app.use("/api/auth", authRoutes);
app.use("/api/guest", guestRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/owner", ownerRoutes);

app.listen(PORT, () => console.log(`Server chạy tại port: ${PORT}`));
