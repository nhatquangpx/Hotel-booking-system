const mongoose = require("mongoose");
const { ROOM_TYPES } = require("../services/rooms/roomTypes");

const SalePromotionSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    scope: {
      type: String,
      enum: ["hotel", "room_type"],
      required: true,
    },
    roomType: {
      type: String,
      enum: ROOM_TYPES,
      required: function () {
        return this.scope === "room_type";
      },
    },
    /** Ngày lưu trú bắt đầu áp giảm (YYYY-MM-DD, múi giờ VN) — không phải ngày đặt phòng */
    startDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    /** Ngày lưu trú kết thúc áp giảm (YYYY-MM-DD, inclusive) */
    endDate: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    discountPercent: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

SalePromotionSchema.index({ hotelId: 1, isActive: 1, startDate: 1, endDate: 1 });

const SalePromotion = mongoose.model("SalePromotion", SalePromotionSchema);
module.exports = SalePromotion;
