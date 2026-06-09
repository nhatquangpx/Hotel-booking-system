const express = require('express');
const router = express.Router();
const { authenticate } = require("../middlewares/authentication");
const { isOwner } = require("../middlewares/authorization");
const { uploadHotelPhotosAndQr, uploadRoomImages, uploadPaymentProof } = require('../config/multerConfig');
const userController = require('../controllers/userController');
const hotelController = require('../controllers/hotelController');
const roomController = require('../controllers/roomController');
const bookingController = require('../controllers/bookingController');
const reviewController = require('../controllers/reviewController');
const notificationController = require('../controllers/notificationController');
const dashboardController = require('../controllers/dashboardController');
const pricingController = require('../controllers/pricingController');
const saleController = require('../controllers/saleController');
const reportController = require('../controllers/reportController');
const {
  updateSelfProfileValidation,
  changePasswordValidation,
  validate: validateProfile,
} = require("../validations/profileValidation");
const {
  updateHotelValidation,
  maintenanceContactValidation,
  validate: validateHotel,
} = require("../validations/hotelValidation");
const {
  ownerCreateRoomValidation,
  updateRoomValidation,
  validate: validateRoom,
} = require("../validations/roomValidation");
const {
  ownerUpdateBookingStatusValidation,
  ownerRejectQrPaymentValidation,
  validate: validateBooking,
} = require("../validations/bookingValidation");
const { replyReviewValidation, validate: validateReview } = require("../validations/reviewValidation");
const {
  saleHotelIdQueryValidation,
  createSaleValidation,
  updateSaleValidation,
  setSaleStatusValidation,
  saleIdParamValidation,
  validate: validateSale,
} = require("../validations/saleValidation");
const {
  dynamicPricingQueryValidation,
  applySuggestedPricesValidation,
  validate: validatePricing,
} = require("../validations/pricingValidation");
const {
  postEquipmentValidation,
  patchEquipmentValidation,
  equipmentRepairRequestValidation,
  validate: validateEquipment,
} = require("../validations/equipmentValidation");
const {
  idParamValidation,
  hotelIdParamValidation,
  roomIdParamAltValidation,
  equipmentIdParamValidation,
  bookingIdParamValidation,
} = require("../validations/paramsValidation");

router.use(authenticate, isOwner);

router.get('/profile', userController.getOwnerProfile);
router.put('/profile', updateSelfProfileValidation, validateProfile, userController.updateOwnerProfile);
router.put('/profile/changepassword', changePasswordValidation, validateProfile, userController.changeOwnerPassword);

router.get('/hotels', hotelController.getHotelsByOwner);
router.get('/hotels/:hotelId/maintenance-contact', hotelIdParamValidation, hotelController.getOwnerHotelMaintenanceContact);
router.put(
  '/hotels/:hotelId/maintenance-contact',
  hotelIdParamValidation,
  maintenanceContactValidation,
  validateHotel,
  hotelController.updateOwnerHotelMaintenanceContact
);
router.get('/hotels/:id', idParamValidation, hotelController.getHotelById);
router.put(
  '/hotels/:id',
  idParamValidation,
  uploadHotelPhotosAndQr,
  updateHotelValidation,
  validateHotel,
  hotelController.updateHotel
);

router.get('/hotels/:hotelId/rooms', hotelIdParamValidation, roomController.getRoomsByHotel);
router.get('/rooms/:id', idParamValidation, roomController.getRoomById);
router.get('/rooms/:id/bookings', idParamValidation, roomController.getOwnerRoomBookings);
router.post(
  '/hotels/:hotelId/rooms',
  hotelIdParamValidation,
  uploadRoomImages,
  ownerCreateRoomValidation,
  validateRoom,
  roomController.createRoom
);
router.put(
  '/rooms/:id',
  idParamValidation,
  uploadRoomImages,
  updateRoomValidation,
  validateRoom,
  roomController.updateRoom
);
router.delete('/rooms/:id', idParamValidation, roomController.deleteRoom);
router.get('/hotels/:hotelId/room-equipment', hotelIdParamValidation, roomController.getOwnerRoomEquipment);
router.post(
  '/rooms/:roomId/equipment',
  roomIdParamAltValidation,
  postEquipmentValidation,
  validateEquipment,
  roomController.postOwnerRoomEquipment
);
router.patch(
  '/rooms/:roomId/equipment/:equipmentId',
  equipmentIdParamValidation,
  patchEquipmentValidation,
  validateEquipment,
  roomController.patchOwnerRoomEquipment
);
router.delete(
  '/rooms/:roomId/equipment/:equipmentId',
  equipmentIdParamValidation,
  roomController.deleteOwnerRoomEquipment
);
router.post(
  '/hotels/:hotelId/equipment-repair-request',
  hotelIdParamValidation,
  equipmentRepairRequestValidation,
  validateEquipment,
  roomController.postOwnerEquipmentRepairRequest
);

router.get('/bookings', bookingController.getBookingsByOwner);
router.get('/bookings/:id', bookingIdParamValidation, bookingController.getBookingById);
router.put(
  '/bookings/:id/status',
  bookingIdParamValidation,
  ownerUpdateBookingStatusValidation,
  validateBooking,
  bookingController.updateBookingStatus
);
router.post(
  '/bookings/:id/confirm-guest-refund',
  bookingIdParamValidation,
  uploadPaymentProof,
  bookingController.confirmGuestRefund
);
router.post(
  '/bookings/:id/reject-qr-payment',
  bookingIdParamValidation,
  ownerRejectQrPaymentValidation,
  validateBooking,
  bookingController.rejectQrPayment
);
router.post('/bookings/:id/check-in', bookingIdParamValidation, bookingController.checkIn);
router.post('/bookings/:id/check-out', bookingIdParamValidation, bookingController.checkOut);

router.get('/reviews', reviewController.getReviewsByOwner);
router.put('/reviews/:id/reply', idParamValidation, replyReviewValidation, validateReview, reviewController.replyToReview);
router.delete('/reviews/:id/reply', idParamValidation, reviewController.deleteReply);

router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', idParamValidation, notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.get('/notifications/load-more', notificationController.loadMoreNotifications);
router.post('/notifications/check-no-show', notificationController.checkNoShowBookings);

router.get('/dashboard/stats', dashboardController.getOwnerDashboardStats);
router.get('/dashboard/revenue', dashboardController.getOwnerRevenueStats);
router.get('/dashboard/rooms', dashboardController.getOwnerRoomStats);
router.get('/dashboard/tasks', dashboardController.getOwnerTodayTasks);

router.get('/reports/export', reportController.exportOwnerReport);

router.get('/pricing/dynamic', dynamicPricingQueryValidation, validatePricing, pricingController.getDynamicPricing);
router.post(
  '/pricing/apply-suggested',
  applySuggestedPricesValidation,
  validatePricing,
  pricingController.applySuggestedPrices
);

router.get('/sales', saleHotelIdQueryValidation, validateSale, saleController.listSales);
router.post('/sales/sync-expired', saleHotelIdQueryValidation, validateSale, saleController.syncExpiredSales);
router.post('/sales', createSaleValidation, validateSale, saleController.createSale);
router.put('/sales/:id', saleIdParamValidation, updateSaleValidation, validateSale, saleController.updateSale);
router.patch('/sales/:id/status', saleIdParamValidation, setSaleStatusValidation, validateSale, saleController.setSaleStatus);
router.delete('/sales/:id', saleIdParamValidation, saleController.deactivateSale);

module.exports = router;
