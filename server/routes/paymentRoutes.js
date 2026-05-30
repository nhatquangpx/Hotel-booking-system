const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middlewares/authentication");
const { isGuest } = require("../middlewares/authorization");
const { uploadPaymentProof } = require("../config/multerConfig");

// VNPay return callback (public — không đăng nhập)
router.get("/vnpay-return", paymentController.vnpayCallback);

// Thanh toán & giao dịch — chỉ guest
router.use(authenticate, isGuest);

router.post("/vnpay/create-payment-url", paymentController.createVNPayPaymentUrl);
router.post("/qr/confirm-payment", uploadPaymentProof, paymentController.confirmQrPayment);
router.get("/transactions", paymentController.getPaymentTransactions);
router.get("/transactions/:id", paymentController.getPaymentTransactionById);

module.exports = router;
