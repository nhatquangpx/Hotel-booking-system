const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authentication");
const { isStaff } = require("../middlewares/authorization");
const { attachStaffHotel } = require("../middlewares/hotelMiddleware");
const roomController = require("../controllers/roomController");
const bookingController = require("../controllers/bookingController");
const hotelController = require("../controllers/hotelController");
const reviewController = require("../controllers/reviewController");

router.use(authenticate, isStaff, attachStaffHotel);

router.get("/bookings", bookingController.getStaffBookings);
router.get("/bookings/:id", bookingController.getStaffBookingById);
router.post("/bookings/:id/check-in", bookingController.staffCheckIn);
router.post("/bookings/:id/check-out", bookingController.staffCheckOut);

router.get("/room-equipment", roomController.getStaffRoomEquipment);
router.post("/rooms/:roomId/equipment", roomController.postStaffRoomEquipment);
router.patch("/rooms/:roomId/equipment/:equipmentId", roomController.patchStaffRoomEquipment);
router.delete("/rooms/:roomId/equipment/:equipmentId", roomController.deleteStaffRoomEquipment);
router.post("/equipment-repair-request", roomController.postStaffEquipmentRepairRequest);

router.get("/hotel/maintenance-contact", hotelController.getStaffHotelMaintenanceContact);

router.get("/reviews", reviewController.getStaffReviews);
router.put("/reviews/:id/reply", reviewController.staffReplyToReview);
router.delete("/reviews/:id/reply", reviewController.staffDeleteReply);

router.get("/rooms", roomController.getStaffRooms);
router.get("/rooms/:id", roomController.getRoomById);
router.patch("/rooms/:id/room-status", roomController.updateStaffRoomStatus);

module.exports = router;
