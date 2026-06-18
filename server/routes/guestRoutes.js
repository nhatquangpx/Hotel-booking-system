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
const { submitContactValidation, validate: validateContact } = require("../validations/contactValidation");
const {
  updateSelfProfileValidation,
  changePasswordValidation,
  validate: validateProfile,
} = require("../validations/profileValidation");
const {
  availableRoomsQueryValidation,
  pricePreviewQueryValidation,
  createBookingValidation,
  cancelBookingValidation,
  validate: validateBooking,
} = require("../validations/bookingValidation");
const {
  addReviewValidation,
  updateReviewValidation,
  validate: validateReview,
} = require("../validations/reviewValidation");
const {
  idParamValidation,
  hotelIdParamValidation,
} = require("../validations/paramsValidation");

router.get('/hotels', hotelController.getAllHotels);
router.get('/hotels/cities', hotelController.getGuestHotelCities);
router.get('/hotels/filter', hotelController.getHotelByFilter);
router.get('/hotels/featured', hotelController.getFeaturedHotels);
router.get('/hotels/:id', optionalAuthenticate, hotelController.getHotelById);
router.get('/hotels/:hotelId/rooms', roomController.getRoomsByHotel);
router.get('/rooms/:id', roomController.getRoomById);
router.post('/contact', submitContactValidation, validateContact, contactController.submitContact);
router.get('/reviews/hotel/:hotelId', reviewController.getReviewsByHotel);

router.use(authenticate, isGuest);

router.get('/profile', userController.getGuestProfile);
router.put('/profile', updateSelfProfileValidation, validateProfile, userController.updateGuestProfile);
router.put('/profile/changepassword', changePasswordValidation, validateProfile, userController.changeGuestPassword);

router.get('/bookings', bookingController.getMyBookings);
router.get(
  '/bookings/available-rooms',
  availableRoomsQueryValidation,
  validateBooking,
  bookingController.getAvailableRooms
);
router.get(
  '/bookings/price-preview',
  pricePreviewQueryValidation,
  validateBooking,
  bookingController.getPricePreview
);
router.post('/bookings', createBookingValidation, validateBooking, bookingController.createBooking);
router.put(
  '/bookings/:id/cancel',
  idParamValidation,
  cancelBookingValidation,
  validateBooking,
  bookingController.cancelBooking
);
router.put(
  '/bookings/:id/review',
  idParamValidation,
  addReviewValidation,
  validateReview,
  reviewController.addReview
);
router.get('/bookings/:id', idParamValidation, bookingController.getBookingById);

router.get('/reviews/booking/:bookingId', reviewController.getReviewByBooking);
router.put('/reviews/:id', idParamValidation, updateReviewValidation, validateReview, reviewController.updateReview);
router.delete('/reviews/:id', idParamValidation, reviewController.deleteReview);

router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', idParamValidation, notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.get('/notifications/load-more', notificationController.loadMoreNotifications);

router.post('/wishlist/:hotelId', hotelIdParamValidation, userController.toggleWishlist);
router.get('/wishlist', userController.getWishlist);

module.exports = router;
