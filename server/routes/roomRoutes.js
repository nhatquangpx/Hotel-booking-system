const express = require("express");
const router = express.Router();
const { 
  getRoomsByHotel, 
  getRoomById, 
  createRoom, 
  updateRoom, 
  deleteRoom 
} = require("../controllers/roomController");
const { verifyToken } = require("../middlewares/authMiddleware");
const { verifyOwnerOrAdmin, verifyRoomOwnerOrAdmin } = require("../middlewares/hotelMiddleware");
const { roomValidation, roomStatusValidation, roomPriceValidation, validate } = require("../validations/roomValidation");

// Tất cả người dùng có thể xem danh sách và chi tiết phòng
router.get("/hotel/:hotelId", getRoomsByHotel);
router.get("/:id", getRoomById);

// Admin hoặc chủ sở hữu khách sạn (staff) có thể tạo phòng mới
router.post("/hotel/:hotelId", [verifyToken, verifyOwnerOrAdmin, roomValidation, validate], createRoom);

// Admin hoặc chủ sở hữu khách sạn (staff) có thể cập nhật/xóa phòng
router.put("/:id", [verifyToken, verifyRoomOwnerOrAdmin, roomValidation, validate], updateRoom);
// Route riêng cho cập nhật trạng thái phòng
router.put("/:id/status", [verifyToken, verifyRoomOwnerOrAdmin, roomStatusValidation, validate], updateRoom);
// Route riêng cho cập nhật giá phòng
router.put("/:id/price", [verifyToken, verifyRoomOwnerOrAdmin, roomPriceValidation, validate], updateRoom);
router.delete("/:id", [verifyToken, verifyRoomOwnerOrAdmin], deleteRoom);

module.exports = router; 