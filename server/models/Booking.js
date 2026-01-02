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
      enum: ["qr_code"],
      default: "qr_code"
    },
    specialRequests: {
      type: String
    },
    cancellationReason: {
      type: String
    }
    // TODO: Thêm các trường sau khi implement logic check-in/check-out:
    // checkedInAt: { type: Date }, // Thời điểm thực tế check-in
    // checkedOutAt: { type: Date }, // Thời điểm thực tế check-out
    // checkedInBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Người thực hiện check-in
    // checkedOutBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Người thực hiện check-out
  },
  { timestamps: true }
);

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
