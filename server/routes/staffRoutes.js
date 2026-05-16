const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authentication");
const { isStaff } = require("../middlewares/authorization");
const { attachStaffHotel } = require("../middlewares/hotelMiddleware");
const roomController = require("../controllers/roomController");

router.use(authenticate, isStaff, attachStaffHotel);

router.get("/rooms", roomController.getStaffRooms);
router.get("/rooms/:id", roomController.getRoomById);
router.patch("/rooms/:id/room-status", roomController.updateStaffRoomStatus);

module.exports = router;
