const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    recipientRole: {
      type: String,
      enum: ["owner", "admin", "guest"],
      required: true
    },
    type: {
      type: String,
      enum: [
        // Owner notifications
        "new_booking",
        "payment_successful",
        "booking_cancelled",
        "room_availability",
        "new_review",
        "negative_review",
        "checkout_today",
        "checkin_today",
        "no_show",
        // Guest notifications
        "booking_confirmed",
        "booking_modified",
        "booking_expired",
        "payment_reminder",
        "refund_processed",
        "upcoming_trip_reminder",
        "checkin_instructions",
        "new_message",
        "review_request",
        "review_reply",
        "promotion",
        "security_alert"
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
      enum: ["Booking", "Review", "Hotel", "Room"]
    },
    isRead: {
      type: Boolean,
      default: false
    },
    readAt: {
      type: Date
    }
  },
  { timestamps: true }
);

NotificationSchema.index({ recipient: 1, createdAt: -1 });
NotificationSchema.index({ recipient: 1, recipientRole: 1, isRead: 1 });
NotificationSchema.index({ recipient: 1, isRead: 1 });

const Notification = mongoose.model("Notification", NotificationSchema);
module.exports = Notification;

