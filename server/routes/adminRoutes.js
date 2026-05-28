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
// const { roomValidation, validate } = require('../validations/roomValidation');



router.use(authenticate, isAdmin);

// Quản lý thông tin cá nhân
router.get("/profile", userController.getAdminProfile);
router.put("/profile", userController.updateAdminProfile);
router.put("/profile/changepassword", userController.changeAdminPassword);

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
router.post("/hotels", uploadHotelPhotosAndQr, hotelController.createHotel);
router.put("/hotels/:id", uploadHotelPhotosAndQr, hotelController.updateHotel);
router.delete("/hotels/:id", hotelController.deleteHotel);

// Quản lý phòng
router.get("/rooms/hotel/:hotelId", roomController.getRoomsByHotel);
router.get("/rooms/:id", roomController.getRoomById);
router.post("/rooms", uploadRoomImages, roomController.createRoom);
router.put("/rooms/:id", uploadRoomImages, roomController.updateRoom);
router.delete("/rooms/:id", roomController.deleteRoom);

// Đặt phòng: admin chỉ xem (GET), không chỉnh trạng thái — owner xử lý thanh toán/hủy/hoàn.
router.get("/bookings", bookingController.getAllBookings);
router.get("/bookings/user/:userId", bookingController.getUserBookings);
router.get("/bookings/:id", bookingController.getBookingById);

// Thống kê
router.get('/dashboard/stats', dashboardController.getAdminStats);
router.get('/dashboard/recent-activities', dashboardController.getRecentActivities);

// Báo cáo 
router.get('/reports/export', reportController.exportAdminReport);

// Quản lý thông báo cho admin
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.get('/notifications/load-more', notificationController.loadMoreNotifications);

// Quản lý liên hệ từ trang public
router.get("/contact-messages", contactController.getContactMessages);
router.put("/contact-messages/:id/read", contactController.markContactMessageAsRead);
router.post("/contact-messages/:id/reply", contactController.replyContactMessage);

module.exports = router;