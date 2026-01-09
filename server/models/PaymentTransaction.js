const mongoose = require("mongoose");

const PaymentTransactionSchema = new mongoose.Schema(
  {
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      index: true
    },
    transactionRef: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    amount: {
      type: Number,
      required: true
    },
    paymentMethod: {
      type: String,
      enum: ["vnpay", "qr_code"],
      required: true
    },
    status: {
      type: String,
      enum: ["pending", "success", "failed", "cancelled"],
      default: "pending",
      index: true
    },
    // VNPay specific fields
    vnpResponseCode: {
      type: String
    },
    vnpTransactionStatus: {
      type: String
    },
    vnpBankCode: {
      type: String
    },
    vnpCardType: {
      type: String
    },
    vnpTxnRef: {
      type: String
    },
    vnpAmount: {
      type: String
    },
    vnpOrderInfo: {
      type: String
    },
    // Lưu toàn bộ raw data từ VNPay callback để debug
    vnpRawData: {
      type: mongoose.Schema.Types.Mixed
    },
    // Thông tin lỗi nếu có
    errorMessage: {
      type: String
    },
    // IP address của client
    clientIp: {
      type: String
    }
  },
  { timestamps: true }
);

// Index để query nhanh
PaymentTransactionSchema.index({ booking: 1, createdAt: -1 });
PaymentTransactionSchema.index({ status: 1, createdAt: -1 });

const PaymentTransaction = mongoose.model("PaymentTransaction", PaymentTransactionSchema);
module.exports = PaymentTransaction;

