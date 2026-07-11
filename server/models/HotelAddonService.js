const mongoose = require("mongoose");

const ADDON_CATEGORIES = ["breakfast", "lunch", "dinner", "spa", "room_service", "other"];
const ADDON_PRICING_UNITS = [
  "per_stay",
  "per_person_per_stay",
  "per_night",
  "per_person_per_night",
];

const HotelAddonServiceSchema = new mongoose.Schema(
  {
    hotelId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    category: {
      type: String,
      enum: ADDON_CATEGORIES,
      default: "other",
    },
    pricingUnit: {
      type: String,
      enum: ADDON_PRICING_UNITS,
      default: "per_stay",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

HotelAddonServiceSchema.index({ hotelId: 1, isActive: 1, name: 1 });

const HotelAddonService = mongoose.model("HotelAddonService", HotelAddonServiceSchema);

module.exports = HotelAddonService;
module.exports.ADDON_CATEGORIES = ADDON_CATEGORIES;
module.exports.ADDON_PRICING_UNITS = ADDON_PRICING_UNITS;
