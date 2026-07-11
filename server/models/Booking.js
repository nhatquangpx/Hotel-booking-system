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
    /** Số khách lưu trú (không vượt quá room.maxPeople) */
    guestCount: {
      type: Number,
      required: true,
      min: 1,
    },
    /** Số CCCD/CMND — snapshot khi đặt phòng, dùng đối chiếu check-in */
    guestIdNumber: {
      type: String,
      trim: true,
    },
    /**
     * Ảnh CCCD mặt trước/sau (private): `cld:authenticated:...` hoặc `local:private:...`
     * Không lưu URL Cloudinary/public.
     */
    guestIdImageFrontUrl: {
      type: String,
    },
    guestIdImageBackUrl: {
      type: String,
    },
    /** Dịch vụ đi kèm đã chọn (snapshot giá tại thời điểm đặt) */
    selectedAddons: [
      {
        service: { type: mongoose.Schema.Types.ObjectId, ref: "HotelAddonService" },
        name: { type: String },
        price: { type: Number },
        pricingUnit: { type: String },
        category: { type: String },
        quantity: { type: Number, default: 1 },
        lineTotal: { type: Number },
      },
    ],
    /** Tổng tiền dịch vụ đi kèm */
    addonsAmount: {
      type: Number,
      default: 0,
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
    /** VNPay callback thành công — chờ chủ KS xác minh tiền đã về */
    vnpayPaidAt: {
      type: Date,
    },
    /** Chủ KS xác minh thanh toán VNPay hoàn tất */
    vnpayOwnerVerifiedAt: {
      type: Date,
    },
    qrPaymentReportedAt: {
      type: Date
    },
    /** Minh chứng QR (private ref — xem qua API auth) */
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
    /** Ảnh minh chứng hoàn tiền (private ref — xem qua API auth). */
    ownerRefundProofUrl: {
      type: String
    },
    checkedInAt: {
      type: Date
    },
    checkedOutAt: {
      type: Date
    },
    /** Phụ thu checkout muộn — thu trực tiếp tại khách sạn, không qua hệ thống thanh toán. */
    lateCheckoutSurcharge: {
      daysOverdue: { type: Number, min: 1 },
      amountCollected: { type: Number, min: 0 },
      note: { type: String, trim: true },
      collectedOffline: { type: Boolean, default: true },
      recordedAt: { type: Date },
    },
    checkInReminderSent: {
      type: Boolean,
      default: false
    },
    /** Hết hạn giữ phòng khi paymentStatus = pending (tự hủy nếu chưa thanh toán). */
    pendingExpiresAt: {
      type: Date,
    },
    /** Chủ KS mở lại đơn đã hủy (lỗi thanh toán chậm, VNPay trễ, …). */
    reopenedAt: {
      type: Date,
    },
    reopenedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    reopenReason: {
      type: String,
      trim: true,
      maxlength: 500,
    },
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

BookingSchema.index({ paymentStatus: 1, pendingExpiresAt: 1 });

const Booking = mongoose.model("Booking", BookingSchema);
module.exports = Booking;
