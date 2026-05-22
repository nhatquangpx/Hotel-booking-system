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
        "security_alert",
        // Admin notifications
        "suspicious_activity",
        "hotel_registration_request",
        "hotel_approved",
        "hotel_rejected",
        "hotel_suspended",
        "high_value_booking",
        "multiple_cancellations",
        "negative_review_spike",
        "system_alert",
        "security_breach_attempt",
        "payment_issue",
        "daily_summary",
        "weekly_report"
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

