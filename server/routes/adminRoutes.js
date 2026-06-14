const express = require("express");
const router = express.Router();
const { authenticate} = require("../middlewares/authentication");
const { isAdmin } = require("../middlewares/authorization");
const userController = require("../controllers/userController");
const hotelController = require("../controllers/hotelController");
const roomController = require("../controllers/roomController");
const bookingController = require("../controllers/bookingController");
const dashboardController = require('../controllers/dashboardController');
const notificationController = require('../controllers/notificationController');
const reportController = require('../controllers/reportController');
const contactController = require("../controllers/contactController");
const { uploadHotelPhotosAndQr, uploadRoomImages } = require('../config/multerConfig');
const {
  createUserValidation,
  updateUserValidation,
  validate: validateUser,
} = require("../validations/userValidation");
const {
  updateSelfProfileValidation,
  changePasswordValidation,
  validate: validateProfile,
} = require("../validations/profileValidation");
const {
  createAdminHotelValidation,
  updateHotelValidation,
  validate: validateHotel,
} = require("../validations/hotelValidation");
const {
  adminCreateRoomValidation,
  updateRoomValidation,
  validate: validateRoom,
} = require("../validations/roomValidation");
const { replyContactValidation, validate: validateContact } = require("../validations/contactValidation");
const {
  idParamValidation,
  hotelIdParamValidation,
  userIdRouteParamValidation,
} = require("../validations/paramsValidation");

router.use(authenticate, isAdmin);

router.get("/profile", userController.getAdminProfile);
router.put("/profile", updateSelfProfileValidation, validateProfile, userController.updateAdminProfile);
router.put("/profile/changepassword", changePasswordValidation, validateProfile, userController.changeAdminPassword);

router.get("/users", userController.getAllUsers);
router.get("/users/:id", idParamValidation, userController.getUserById);
router.post("/users", createUserValidation, validateUser, userController.createUser);
router.put("/users/:id", idParamValidation, updateUserValidation, validateUser, userController.updateUser);
router.delete("/users/:id", idParamValidation, userController.deleteUser);

router.get("/hotels", hotelController.getAllHotels);
router.get("/hotels/:id", idParamValidation, hotelController.getHotelById);
router.get("/hotels/owners/list", hotelController.getAllOwners);
router.post(
  "/hotels",
  uploadHotelPhotosAndQr,
  createAdminHotelValidation,
  validateHotel,
  hotelController.createHotel
);
router.put(
  "/hotels/:id",
  idParamValidation,
  uploadHotelPhotosAndQr,
  updateHotelValidation,
  validateHotel,
  hotelController.updateHotel
);
router.delete("/hotels/:id", idParamValidation, hotelController.deleteHotel);

router.get("/rooms/hotel/:hotelId", hotelIdParamValidation, roomController.getRoomsByHotel);
router.get("/rooms/:id", idParamValidation, roomController.getRoomById);
router.post(
  "/rooms",
  uploadRoomImages,
  adminCreateRoomValidation,
  validateRoom,
  roomController.createRoom
);
router.put(
  "/rooms/:id",
  idParamValidation,
  uploadRoomImages,
  updateRoomValidation,
  validateRoom,
  roomController.updateRoom
);
router.delete("/rooms/:id", idParamValidation, roomController.deleteRoom);

router.get("/bookings", bookingController.getAllBookings);
router.get("/bookings/user/:userId", userIdRouteParamValidation, bookingController.getUserBookings);
router.get("/bookings/:id", idParamValidation, bookingController.getBookingById);

router.get('/dashboard/stats', dashboardController.getAdminStats);
router.get('/dashboard/recent-activities', dashboardController.getRecentActivities);

router.get('/reports/export', reportController.exportAdminReport);

router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', idParamValidation, notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.get('/notifications/load-more', notificationController.loadMoreNotifications);

router.get("/contact-messages", contactController.getContactMessages);
router.put("/contact-messages/:id/read", idParamValidation, contactController.markContactMessageAsRead);
router.post(
  "/contact-messages/:id/reply",
  idParamValidation,
  replyContactValidation,
  validateContact,
  contactController.replyContactMessage
);

module.exports = router;
