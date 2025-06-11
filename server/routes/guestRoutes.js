const express = require('express');
const router = express.Router();
const { authenticate } = require("../middlewares/authentication");
const userController = require('../controllers/userController');
const hotelController = require('../controllers/hotelController');
const roomController = require('../controllers/roomController');
const bookingController = require('../controllers/bookingController');

router.use(authenticate);

// Quản lý thông tin cá nhân
router.get('/profile/:id', userController.getUserById);
router.put('/profile/:id', userController.updateUser);
router.put('/profile/:id/changepassword', userController.changePassword);

// Xem danh sách khách sạn
router.get('/hotels', hotelController.getAllHotels);
router.get('/hotels/:id', hotelController.getHotelById);

// Xem danh sách phòng
router.get('/hotels/:hotelId/rooms', roomController.getRoomsByHotel);
router.get('/rooms/:id', roomController.getRoomById);

// Quản lý đặt phòng
router.get('/bookings', bookingController.getMyBookings);
router.get('/bookings/available-rooms', bookingController.getAvailableRooms);
router.get('/bookings/:id', bookingController.getBookingById);
router.post('/bookings', bookingController.createBooking);
router.put('/bookings/:id/cancel', bookingController.cancelBooking);

// Đánh giá và bình luận
// router.post('/hotels/:id/reviews', hotelController.addHotelReview);
// router.post('/rooms/:id/reviews', roomController.addRoomReview);

module.exports = router;