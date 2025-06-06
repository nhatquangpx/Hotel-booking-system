const mongoose = require("mongoose");

const HotelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    description: {
      type: String,
      required: true
    },
    address: {
      number: { type: String, required: true },
      street: { type: String, required: true },
      city: { type: String, required: true },
    },
    images: [String],
    starRating: {
      type: Number,
      min: 1,
      max: 5,
      required: true
    },
    contactInfo: {
      phone: { type: String, required: true },
      email: { type: String, required: true }
    },
    policies: {
      checkInTime: { type: String, default: "14:00" },
      checkOutTime: { type: String, default: "12:00" }
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active"
    }
  },
  { timestamps: true }
);

const Hotel = mongoose.model("Hotel", HotelSchema);
module.exports = Hotel;
