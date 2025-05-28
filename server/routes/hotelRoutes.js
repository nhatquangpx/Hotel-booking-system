const express = require("express");
const router = express.Router();
const { 
  getAllHotels, 
  getHotelById, 
  createHotel, 
  updateHotel, 
  deleteHotel,
  getHotelsByOwner
} = require("../controllers/hotelController");
const { verifyToken} = require("../middlewares/authMiddleware");
const { verifyOwnerOrAdmin, verifyAdmin } = require("../middlewares/hotelMiddleware");
const { hotelValidation, validate } = require("../validations/hotelValidation");

// Tất cả người dùng có thể xem danh sách và chi tiết khách sạn
router.get("/", getAllHotels);
router.get("/:id", getHotelById);

// Lấy danh sách khách sạn của chính mình (staff)
router.get("/my/hotels", verifyToken, getHotelsByOwner);

// Chỉ admin mới có quyền tạo khách sạn mới
router.post("/", [verifyToken, verifyAdmin, hotelValidation, validate], createHotel);

// Admin hoặc chủ sở hữu khách sạn (staff) có thể cập nhật
router.put("/:id", [verifyToken, verifyOwnerOrAdmin, hotelValidation, validate], updateHotel);

// Chỉ admin mới có quyền xóa khách sạn
router.delete("/:id", [verifyToken, verifyAdmin], deleteHotel);

module.exports = router; 