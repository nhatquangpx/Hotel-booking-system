const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { authenticate } = require("../middlewares/authentication");
const { isGuest } = require("../middlewares/authorization");
const { uploadPaymentProof } = require("../config/multerConfig");
const {
  createVNPayUrlValidation,
  confirmQrPaymentValidation,
  validate: validatePayment,
} = require("../validations/paymentValidation");
const { idParamValidation } = require("../validations/paramsValidation");

router.get("/vnpay-return", paymentController.vnpayCallback);

router.use(authenticate, isGuest);

router.post(
  "/vnpay/create-payment-url",
  createVNPayUrlValidation,
  validatePayment,
  paymentController.createVNPayPaymentUrl
);
router.post(
  "/qr/confirm-payment",
  uploadPaymentProof,
  confirmQrPaymentValidation,
  validatePayment,
  paymentController.confirmQrPayment
);

router.get("/transactions", paymentController.getPaymentTransactions);
router.get("/transactions/:id", idParamValidation, paymentController.getPaymentTransactionById);

module.exports = router;
