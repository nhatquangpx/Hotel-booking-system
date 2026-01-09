const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middlewares/authentication");

// VNPay payment endpoints
router.post("/vnpay/create-payment-url", authenticate, paymentController.createVNPayPaymentUrl);
router.get("/vnpay-return", paymentController.vnpayCallback);

// Payment transaction endpoints (cho admin/guest xem lịch sử giao dịch)
router.get("/transactions", authenticate, paymentController.getPaymentTransactions);
router.get("/transactions/:id", authenticate, paymentController.getPaymentTransactionById);

module.exports = router;