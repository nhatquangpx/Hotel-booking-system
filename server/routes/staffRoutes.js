const express = require("express");
const router = express.Router();
const { authenticate } = require("../middlewares/authentication");
const { isStaff } = require("../middlewares/authorization");
const { attachStaffHotel } = require("../middlewares/hotelMiddleware");
const roomController = require("../controllers/roomController");
const bookingController = require("../controllers/bookingController");
const hotelController = require("../controllers/hotelController");
const reviewController = require("../controllers/reviewController");
const dashboardController = require("../controllers/dashboardController");
const notificationController = require("../controllers/notificationController");
const userController = require("../controllers/userController");
const {
  updateSelfProfileValidation,
  changePasswordValidation,
  validate: validateProfile,
} = require("../validations/profileValidation");
const { updateRoomStatusValidation, validate: validateRoom } = require("../validations/roomValidation");
const {
  replyReviewValidation,
  listReviewsQueryValidation,
  validate: validateReview,
} = require("../validations/reviewValidation");
const {
  postEquipmentValidation,
  patchEquipmentValidation,
  equipmentRepairRequestValidation,
  validate: validateEquipment,
} = require("../validations/equipmentValidation");
const {
  idParamValidation,
  roomIdParamAltValidation,
  equipmentIdParamValidation,
  bookingIdParamValidation,
} = require("../validations/paramsValidation");

router.use(authenticate, isStaff);

router.get("/profile", userController.getStaffProfile);
router.put("/profile", updateSelfProfileValidation, validateProfile, userController.updateStaffProfile);
router.put("/profile/changepassword", changePasswordValidation, validateProfile, userController.changeStaffPassword);

router.use(attachStaffHotel);

router.get("/dashboard", dashboardController.getStaffDashboard);

router.get("/notifications", notificationController.getNotifications);
router.get("/notifications/unread-count", notificationController.getUnreadCount);
router.put("/notifications/:id/read", idParamValidation, notificationController.markAsRead);
router.put("/notifications/read-all", notificationController.markAllAsRead);
router.get("/notifications/load-more", notificationController.loadMoreNotifications);

router.get("/bookings", bookingController.getStaffBookings);
router.get("/bookings/:id", bookingIdParamValidation, bookingController.getStaffBookingById);
router.post("/bookings/:id/check-in", bookingIdParamValidation, bookingController.staffCheckIn);
router.post("/bookings/:id/check-out", bookingIdParamValidation, bookingController.staffCheckOut);

router.get("/room-equipment", roomController.getStaffRoomEquipment);
router.post(
  "/rooms/:roomId/equipment",
  roomIdParamAltValidation,
  postEquipmentValidation,
  validateEquipment,
  roomController.postStaffRoomEquipment
);
router.patch(
  "/rooms/:roomId/equipment/:equipmentId",
  equipmentIdParamValidation,
  patchEquipmentValidation,
  validateEquipment,
  roomController.patchStaffRoomEquipment
);
router.delete(
  "/rooms/:roomId/equipment/:equipmentId",
  equipmentIdParamValidation,
  roomController.deleteStaffRoomEquipment
);
router.post(
  "/equipment-repair-request",
  equipmentRepairRequestValidation,
  validateEquipment,
  roomController.postStaffEquipmentRepairRequest
);

router.get("/hotel/maintenance-contact", hotelController.getStaffHotelMaintenanceContact);

router.get("/reviews", listReviewsQueryValidation, validateReview, reviewController.getStaffReviews);
router.put("/reviews/:id/reply", idParamValidation, replyReviewValidation, validateReview, reviewController.staffReplyToReview);
router.delete("/reviews/:id/reply", idParamValidation, reviewController.staffDeleteReply);

router.get("/rooms", roomController.getStaffRooms);
router.get("/rooms/:id", idParamValidation, roomController.getRoomById);
router.patch(
  "/rooms/:id/room-status",
  idParamValidation,
  updateRoomStatusValidation,
  validateRoom,
  roomController.updateStaffRoomStatus
);

module.exports = router;
