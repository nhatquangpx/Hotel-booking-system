const express = require("express");
const router = express.Router();
const { 
  createBooking, 
  getUserBookings, 
  getBookingById, 
  cancelBooking,
  getAllBookings 
} = require("../controllers/bookingController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { verifyAdmin } = require("../middlewares/hotelMiddleware");

// Tạo booking mới - người dùng đã đăng nhập
router.post("/", verifyToken, createBooking);

// Lấy booking của người dùng hiện tại
router.get("/my-bookings", verifyToken, getUserBookings);

// Admin xem tất cả bookings
router.get("/", [verifyToken, verifyAdmin], getAllBookings);

// Xem chi tiết booking - admin hoặc chủ booking
router.get("/:id", verifyToken, getBookingById);

// Hủy booking - admin hoặc chủ booking
router.put("/:id/cancel", verifyToken, cancelBooking);

module.exports = router; 