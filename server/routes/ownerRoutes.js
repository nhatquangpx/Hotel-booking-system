const express = require('express');
const router = express.Router();
const { authenticate } = require("../middlewares/authentication");
const { isOwner } = require("../middlewares/authorization");
const { uploadHotelImages, uploadRoomImages } = require('../config/multerConfig');
const userController = require('../controllers/userController');
const hotelController = require('../controllers/hotelController');
const roomController = require('../controllers/roomController');
const bookingController = require('../controllers/bookingController');
// const dashboardController = require('../controllers/dashboardController');

router.use(authenticate, isOwner);

// Quản lý thông tin cá nhân    
router.get('/profile', userController.getUserById);
router.put('/profile', userController.updateUser);

// Quản lý khách sạn
router.get('/hotels', hotelController.getHotelsByOwner);
router.get('/hotels/:id', hotelController.getHotelById);
router.put('/hotels/:id', hotelController.updateHotel);
router.delete('/hotels/:id', hotelController.deleteHotel);

// Quản lý phòng
router.get('/hotels/:hotelId/rooms', roomController.getRoomsByHotel);
router.get('/rooms/:id', roomController.getRoomById);
router.post('/hotels/:hotelId/rooms', uploadRoomImages, roomController.createRoom);
router.put('/rooms/:id', uploadRoomImages, roomController.updateRoom);
router.delete('/rooms/:id', roomController.deleteRoom);

// Quản lý đặt phòng
router.get('/bookings', bookingController.getBookingsByOwner);
router.get('/bookings/:id', bookingController.getBookingById);
router.put('/bookings/:id/status', bookingController.updateBookingStatus);
// TODO: Thêm các routes sau khi implement logic check-in/check-out:
// router.post('/bookings/:id/check-in', bookingController.checkIn);
// router.post('/bookings/:id/check-out', bookingController.checkOut);

// // Quản lý đánh giá
// router.get('/reviews', hotelController.getHotelReviews);
// router.put('/reviews/:id/reply', hotelController.replyToReview);

// // Thống kê
// router.get('/dashboard/stats', dashboardController.getOwnerDashboardStats);
// router.get('/dashboard/revenue', dashboardController.getOwnerRevenueStats);
// router.get('/dashboard/bookings', dashboardController.getOwnerBookingStats);
// router.get('/dashboard/rooms', dashboardController.getOwnerRoomStats);

module.exports = router;
