const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema(
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
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true
    },
    checkInDate: {
      type: Date,
      required: true
    },
    checkOutDate: {
      type: Date,
      required: true
    },
    /** Thành tiền sau sale — số tiền khách phải trả */
    finalAmount: {
      type: Number,
      required: true,
    },
    /** Tổng tiền trước chương trình sale (giá phòng × số đêm) */
    basePrice: {
      type: Number,
    },
    /** Giảm giá do chương trình sale (server tính, không tin client) */
    discountAmount: {
      type: Number,
      default: 0,
    },
    promotionApplied: {
      title: { type: String },
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending"
    },
    paymentMethod: {
      type: String,
      enum: ["qr_code", "vnpay"],
      default: "qr_code"
    },
    vnpTransactionRef: {
      type: String
    },
    qrPaymentReportedAt: {
      type: Date
    },
    qrPaymentProofUrl: {
      type: String
    },
    ownerPaymentRejectionReason: {
      type: String,
      trim: true
    },
    /** Loại từ chối QR: invalid_proof | payment_not_successful */
    ownerQrRejectionType: {
      type: String,
      enum: ["invalid_proof", "payment_not_successful"],
    },
    specialRequests: {
      type: String
    },
    cancellationReason: {
      type: String
    },
    /** Khách gửi yêu cầu hủy (luôn set khi khách hủy từ app). */
    guestCancelRequestedAt: {
      type: Date
    },
    /** Snapshot tại thời điểm khách hủy (để chủ KS xử lý hoàn tiền). */
    guestCancelSnapshot: {
      wasPaid: { type: Boolean },
      paymentMethod: { type: String, enum: ["qr_code", "vnpay"] },
      refundPolicyEligible: { type: Boolean }
    },
    /** STK nhận hoàn tiền do khách cung cấp khi hủy đơn đủ điều kiện hoàn (đã thanh toán). */
    guestRefundBankAccountName: { type: String, trim: true },
    guestRefundBankAccountNumber: { type: String, trim: true },
    guestRefundBankName: { type: String, trim: true },
    /** Chủ KS xác nhận đã hoàn tiền (đơn đã hủy, đủ điều kiện hoàn). */
    ownerRefundCompletedAt: {
      type: Date
    },
    /** Ảnh minh chứng hoàn tiền do chủ khách sạn tải lên khi xác nhận hoàn. */
    ownerRefundProofUrl: {
      type: String
    },
    checkedInAt: {
      type: Date
    },
    checkedOutAt: {
      type: Date
    },
    checkInReminderSent: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

/** Hỗ trợ truy vấn overlap theo khoảng ngày (dynamic pricing, báo cáo). */
BookingSchema.index({
  hotel: 1,
  room: 1,
  paymentStatus: 1,
  checkInDate: 1,
  checkOutDate: 1,
});

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
