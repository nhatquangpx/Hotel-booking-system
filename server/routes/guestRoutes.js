const express = require('express');
const router = express.Router();
const { authenticate } = require("../middlewares/authentication");
const userController = require('../controllers/userController');
const hotelController = require('../controllers/hotelController');
const roomController = require('../controllers/roomController');
const bookingController = require('../controllers/bookingController');
const reviewController = require('../controllers/reviewController');

// ===== PUBLIC ROUTES (không cần authentication) =====

// Xem danh sách khách sạn - PUBLIC
router.get('/hotels', hotelController.getAllHotels);
router.get('/hotels/filter', hotelController.getHotelByFilter);
router.get('/hotels/featured', hotelController.getFeaturedHotels);
router.get('/hotels/:id', hotelController.getHotelById);

// Xem danh sách phòng - PUBLIC
router.get('/hotels/:hotelId/rooms', roomController.getRoomsByHotel);
router.get('/rooms/:id', roomController.getRoomById);

// ===== PROTECTED ROUTES (cần authentication) =====

// Quản lý thông tin cá nhân - PROTECTED
router.get('/profile/:id', authenticate, userController.getUserById);
router.put('/profile/:id', authenticate, userController.updateUser);
router.put('/profile/:id/changepassword', authenticate, userController.changePassword);

// Quản lý đặt phòng - PROTECTED
router.get('/bookings', authenticate, bookingController.getMyBookings);
router.get('/bookings/available-rooms', authenticate, bookingController.getAvailableRooms);
router.post('/bookings', authenticate, bookingController.createBooking);
router.put('/bookings/:id/cancel', authenticate, bookingController.cancelBooking);
// Route đánh giá phải đặt trước route /bookings/:id để tránh conflict
router.put('/bookings/:id/review', authenticate, reviewController.addReview);
router.get('/bookings/:id', authenticate, bookingController.getBookingById);

// Đánh giá và bình luận
router.get('/reviews/hotel/:hotelId', reviewController.getReviewsByHotel); // PUBLIC
router.get('/reviews/booking/:bookingId', authenticate, reviewController.getReviewByBooking); // PROTECTED
router.put('/reviews/:id', authenticate, reviewController.updateReview); // PROTECTED - Cập nhật review
router.delete('/reviews/:id', authenticate, reviewController.deleteReview); // PROTECTED - Xóa review

module.exports = router;