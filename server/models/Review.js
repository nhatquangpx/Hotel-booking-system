const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema(
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
    booking: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Booking",
      required: true,
      unique: true 
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000
    }
  },
  { timestamps: true }
);

ReviewSchema.index({ hotel: 1, createdAt: -1 });
ReviewSchema.index({ guest: 1, createdAt: -1 });
ReviewSchema.index({ booking: 1 }, { unique: true });

const Review = mongoose.model("Review", ReviewSchema);
module.exports = Review;

