const mongoose = require("mongoose");

const RoomSchema = new mongoose.Schema(
  {
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true
    },
    name: {
      type: String,
      required: true,
      trim: true
    },
    type: {
      type: String,
      required: true,
      enum: ["single", "double", "family", "vip"]
    },
    description: {
      type: String,
      required: true
    },
    price: {
      regular: { type: Number, required: true },
      discount: { type: Number, default: 0 }
    },
    images: [String],
    status: {
      type: String,
      enum: ["available", "booked", "maintenance"],
      default: "available"
    }
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
