const mongoose = require("mongoose");

/**
 * Cờ cảnh báo khách hủy đơn liên tục — admin xem xét để inactive tạm / vĩnh viễn.
 * Chỉ đếm hủy do guest (guestCancelRequestedAt), không tính hết hạn pending / owner hủy.
 */
const CancelAbuseFlagSchema = new mongoose.Schema(
  {
    guest: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    cancelCount: {
      type: Number,
      required: true,
      min: 1,
    },
    windowStart: {
      type: Date,
      required: true,
    },
    windowEnd: {
      type: Date,
      required: true,
    },
    bookingIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Booking",
      },
    ],
    status: {
      type: String,
      enum: ["pending", "dismissed", "sanctioned"],
      default: "pending",
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    adminNote: {
      type: String,
      trim: true,
      default: "",
    },
    /** Số ngày cấm khi sanctioned; null = vô thời hạn cho đến khi admin mở lại */
    sanctionDays: {
      type: Number,
      default: null,
    },
    sanctionUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

CancelAbuseFlagSchema.index({ guest: 1, status: 1 });
CancelAbuseFlagSchema.index({ status: 1, createdAt: -1 });

const CancelAbuseFlag = mongoose.model("CancelAbuseFlag", CancelAbuseFlagSchema);
module.exports = CancelAbuseFlag;
