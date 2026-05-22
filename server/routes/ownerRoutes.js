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

router.use(authenticate, isOwner);

// Quản lý thông tin cá nhân    
router.get('/profile', userController.getOwnerProfile);
router.put('/profile', userController.updateOwnerProfile);
router.put('/profile/changepassword', userController.changeOwnerPassword);

// Quản lý khách sạn
router.get('/hotels', hotelController.getHotelsByOwner);
router.get('/hotels/:hotelId/maintenance-contact', hotelController.getOwnerHotelMaintenanceContact);
router.put('/hotels/:hotelId/maintenance-contact', hotelController.updateOwnerHotelMaintenanceContact);
router.get('/hotels/:id', hotelController.getHotelById);
router.put('/hotels/:id', uploadHotelPhotosAndQr, hotelController.updateHotel);

// Quản lý phòng
router.get('/hotels/:hotelId/rooms', roomController.getRoomsByHotel);
router.get('/rooms/:id', roomController.getRoomById);
router.post('/hotels/:hotelId/rooms', uploadRoomImages, roomController.createRoom);
router.put('/rooms/:id', uploadRoomImages, roomController.updateRoom);
router.delete('/rooms/:id', roomController.deleteRoom);
router.get('/hotels/:hotelId/room-equipment', roomController.getOwnerRoomEquipment);
router.post('/rooms/:roomId/equipment', roomController.postOwnerRoomEquipment);
router.patch('/rooms/:roomId/equipment/:equipmentId', roomController.patchOwnerRoomEquipment);
router.delete('/rooms/:roomId/equipment/:equipmentId', roomController.deleteOwnerRoomEquipment);
router.post('/hotels/:hotelId/equipment-repair-request', roomController.postOwnerEquipmentRepairRequest);

// Quản lý đặt phòng
router.get('/bookings', bookingController.getBookingsByOwner);
router.get('/bookings/:id', bookingController.getBookingById);
router.put('/bookings/:id/status', bookingController.updateBookingStatus);
router.post('/bookings/:id/confirm-guest-refund', uploadPaymentProof, bookingController.confirmGuestRefund);
router.post('/bookings/:id/check-in', bookingController.checkIn);
router.post('/bookings/:id/check-out', bookingController.checkOut);

// Quản lý đánh giá
router.get('/reviews', reviewController.getReviewsByOwner);
router.put('/reviews/:id/reply', reviewController.replyToReview);
router.delete('/reviews/:id/reply', reviewController.deleteReply);

// Quản lý thông báo
router.get('/notifications', notificationController.getNotifications);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.put('/notifications/:id/read', notificationController.markAsRead);
router.put('/notifications/read-all', notificationController.markAllAsRead);
router.get('/notifications/load-more', notificationController.loadMoreNotifications);
router.post('/notifications/check-no-show', notificationController.checkNoShowBookings);

// Thống kê Dashboard
router.get('/dashboard/stats', dashboardController.getOwnerDashboardStats);
router.get('/dashboard/revenue', dashboardController.getOwnerRevenueStats);
router.get('/dashboard/rooms', dashboardController.getOwnerRoomStats);
router.get('/dashboard/tasks', dashboardController.getOwnerTodayTasks);

// Báo cáo 
router.get('/reports/export', reportController.exportOwnerReport);

// Giá động (gợi ý)
router.get('/pricing/dynamic', pricingController.getDynamicPricing);
router.post('/pricing/apply-suggested', pricingController.applySuggestedPrices);

// Chương trình sale
router.get('/sales', saleController.listSales);
router.post('/sales/sync-expired', saleController.syncExpiredSales);
router.post('/sales', saleController.createSale);
router.put('/sales/:id', saleController.updateSale);
router.patch('/sales/:id/status', saleController.setSaleStatus);
router.delete('/sales/:id', saleController.deactivateSale);

module.exports = router;
