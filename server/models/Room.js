const mongoose = require("mongoose");

/** Trang thiết bị trong phòng (theo dõi vận hành / sửa chữa). */
const RoomEquipmentItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["operational", "under_repair", "broken"],
      default: "operational",
    },
  },
  { _id: true }
);

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
      type: Number,
      required: true,
      min: 0,
    },
    maxPeople: {
      type: Number,
      required: true,
      min: 1
    },
    facilities: [String],
    roomEquipment: {
      type: [RoomEquipmentItemSchema],
      default: [],
      /** Không trả về mặc định (API guest / danh sách phòng). Owner: .select('+roomEquipment'). */
      select: false,
    },
    images: [String],
    roomStatus: {
      type: String,
      enum: ["active", "maintenance", "inactive"],
      default: "active"
    },
    bookingStatus: {
      type: String,
      enum: ["empty", "occupied", "pending"],
      default: "empty"
    }
  },
  { timestamps: true }
);

const Room = mongoose.model("Room", RoomSchema);
module.exports = Room;
