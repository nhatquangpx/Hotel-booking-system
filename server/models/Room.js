const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    },
    roomNumber: {
      type: String,
      required: true,
      trim: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ["standard", "deluxe", "suite", "family", "executive"]
    },
    description: {
      type: String,
      required: true
    },
    price: {
      regular: { type: Number, required: true },
      discount: { type: Number, default: 0 }
    },
    maxPeople: {
      type: Number,
      required: true,
      min: 1
    },
    quantity: {
      type: Number,
      required: true,
      min: 1
    },
    facilities: [String],
    images: [String],
    status: {
      type: String,
      enum: ["active", "maintenance", "inactive"],
      default: "active"
    }
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
