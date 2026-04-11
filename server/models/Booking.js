const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
  {
    guest: {
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
      enum: ["qr_code", "vnpay"],
      default: "qr_code"
    },
    vnpTransactionRef: {
      type: String
    },
    specialRequests: {
      type: String
    },
    cancellationReason: {
      type: String
    },
    checkedInAt: {
      type: Date
    },
    checkedOutAt: {
      type: Date
    },
    checkInReminderSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

/** Hỗ trợ truy vấn overlap theo khoảng ngày (dynamic pricing, báo cáo). */
BookingSchema.index({
  hotel: 1,
  room: 1,
  paymentStatus: 1,
  checkInDate: 1,
  checkOutDate: 1,
});

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
