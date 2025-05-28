const mongoose = require("mongoose");

const BookingHistorySchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },
    checkInDate: {
      type: Date,
      required: true
    },
    checkOutDate: {
      type: Date,
      required: true
    },
    guestDetails: {
      adults: { type: Number, required: true, min: 1 },
      children: { type: Number, default: 0 },
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true }
    },
    totalAmount: {
      type: Number,
      required: true
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending"
    },
    paymentMethod: {
      type: String,
      enum: ["credit_card", "debit_card", "paypal", "bank_transfer", "cash"],
      required: true
    },
    specialRequests: {
      type: String
    },
    cancellationReason: {
      type: String
    },
    transactionId: {
      type: String
    }
  },
  { timestamps: true }
);

const BookingHistory = mongoose.model("BookingHistory", BookingHistorySchema);
module.exports = BookingHistory;
