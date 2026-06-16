const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: function requiredRecipient() {
        return this.recipientRole !== "hotel";
      },
    },
    recipientRole: {
      type: String,
      enum: ["guest", "admin", "hotel"],
      required: true
    },
    /** Thông báo dùng chung owner + staff của khách sạn */
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Hotel",
      required: function requiredHotel() {
        return this.recipientRole === "hotel";
      },
    },
    readBy: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      default: [],
    },
    type: {
      type: String,
      enum: [
        // Owner + staff (recipientRole: "hotel")
        "new_booking",
        "new_review",
        "negative_review",
        "checkout_today",
        "checkin_today",
        "no_show",
        "hotel_status_changed",
        // Guest (recipientRole: "guest")
        "booking_confirmed",
        "payment_rejected",
        "qr_proof_resubmit",
        "refund_processed",
        // Guest + owner/staff (cùng type; phân biệt bởi recipientRole)
        "booking_cancelled",
        // Admin (recipientRole: "admin")
        "high_value_booking",
      ],
      required: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    message: {
      type: String,
      required: true,
      trim: true
    },
    relatedId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "relatedModel"
    },
    relatedModel: {
      type: String,
      enum: ["Booking", "Review", "Hotel", "Room", "User"]
    },
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, recipientRole: 1 });
NotificationSchema.index({ hotel: 1, recipientRole: 1, createdAt: -1 });
NotificationSchema.index({ hotel: 1, type: 1, relatedId: 1 });
NotificationSchema.index({ readBy: 1 });

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;

