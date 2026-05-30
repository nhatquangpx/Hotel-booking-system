const express = require('express');
const router = express.Router();
const { authenticate, optionalAuthenticate } = require("../middlewares/authentication");
const { isGuest } = require("../middlewares/authorization");
const userController = require('../controllers/userController');
const hotelController = require('../controllers/hotelController');
const roomController = require('../controllers/roomController');
const bookingController = require('../controllers/bookingController');
const reviewController = require('../controllers/reviewController');
const contactController = require("../controllers/contactController");
const notificationController = require('../controllers/notificationController');

// ===== PUBLIC ROUTES (không cần authentication) =====

router.get('/hotels', hotelController.getAllHotels);
router.get('/hotels/filter', hotelController.getHotelByFilter);
router.get('/hotels/featured', hotelController.getFeaturedHotels);
router.get('/hotels/:id', optionalAuthenticate, hotelController.getHotelById);

router.get('/hotels/:hotelId/rooms', roomController.getRoomsByHotel);
router.get('/rooms/:id', roomController.getRoomById);
router.post('/contact', contactController.submitContact);

router.get('/reviews/hotel/:hotelId', reviewController.getReviewsByHotel);

// ===== PROTECTED ROUTES (authenticate + isGuest) =====

router.use(authenticate, isGuest);

router.get('/profile/:id', userController.getGuestProfile);
router.put('/profile/:id', userController.updateGuestProfile);
router.put('/profile/:id/changepassword', userController.changeGuestPassword);

router.get('/bookings', bookingController.getMyBookings);
router.get('/bookings/available-rooms', bookingController.getAvailableRooms);
router.get('/bookings/price-preview', bookingController.getPricePreview);
router.post('/bookings', bookingController.createBooking);
router.put('/bookings/:id/cancel', bookingController.cancelBooking);
router.put('/bookings/:id/review', reviewController.addReview);
router.get('/bookings/:id', bookingController.getBookingById);

router.get('/reviews/booking/:bookingId', reviewController.getReviewByBooking);
router.put('/reviews/:id', reviewController.updateReview);
router.delete('/reviews/:id', reviewController.deleteReview);

router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.get('/notifications/load-more', notificationController.loadMoreNotifications);

router.get('/wishlist', userController.getWishlist);
router.post('/wishlist/:hotelId', userController.toggleWishlist);

module.exports = router;
