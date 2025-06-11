const express = require("express");
const router = express.Router();
const { authenticate} = require("../middlewares/authentication");
const { isAdmin } = require("../middlewares/authorization");
const userController = require("../controllers/userController");
const hotelController = require("../controllers/hotelController");
const roomController = require("../controllers/roomController");
const bookingController = require("../controllers/bookingController");
const dashboardController = require('../controllers/dashboardController');
const { uploadHotelImages, uploadRoomImages } = require('../config/multerConfig');
// const { roomValidation, validate } = require('../validations/roomValidation');



router.use(authenticate, isAdmin);

// Quản lý người dùng
router.get("/users", userController.getAllUsers);
router.get("/users/:id", userController.getUserById);
router.post("/users", userController.createUser);
router.put("/users/:id", userController.updateUser);
router.delete("/users/:id", userController.deleteUser);

// Quản lý khách sạn
router.get("/hotels", hotelController.getAllHotels);
router.get("/hotels/:id", hotelController.getHotelById);
router.get("/hotels/owners/list", hotelController.getAllOwners);
router.post("/hotels",  uploadHotelImages, hotelController.createHotel);
router.put("/hotels/:id",uploadHotelImages, hotelController.updateHotel);
router.delete("/hotels/:id", hotelController.deleteHotel);

// Quản lý phòng
router.get("/rooms/hotel/:hotelId", roomController.getRoomsByHotel);
router.get("/rooms/:id", roomController.getRoomById);
router.post("/rooms", uploadRoomImages, roomController.createRoom);
router.put("/rooms/:id", uploadRoomImages, roomController.updateRoom);
router.delete("/rooms/:id", roomController.deleteRoom);

// Quản lý đặt phòng
router.get("/bookings", bookingController.getAllBookings);
router.get("/bookings/user/:userId", bookingController.getUserBookings);
router.get("/bookings/:id", bookingController.getBookingById);
router.put("/bookings/:id/status", bookingController.updateBookingStatus);

// Thống kê
router.get('/dashboard/stats', dashboardController.getAdminStats);
router.get('/dashboard/recent-activities', dashboardController.getRecentActivities);

module.exports = router;