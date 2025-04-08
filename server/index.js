const express = require("express");
const dotenv = require("dotenv").config();
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const adminUserRoutes = require("./routes/adminUserRoutes");

const app = express();
const PORT = process.env.PORT || 8001;

// Kết nối MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Routes
app.use("/auth", authRoutes);
app.use("/api/admin/", require("./routes/adminUserRoutes"));

app.listen(PORT, () => console.log(`Server chạy tại port: ${PORT}`));
