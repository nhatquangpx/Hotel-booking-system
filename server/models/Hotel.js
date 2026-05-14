const mongoose = require("mongoose");

const HotelPaymentQrSchema = new mongoose.Schema(
  {
    accountName: { type: String, trim: true },
    accountNumber: { type: String, trim: true },
    bankName: { type: String, trim: true },
    qrImageUrl: { type: String, trim: true }
  },
  { _id: false }
);

const HotelPaymentVnpaySchema = new mongoose.Schema(
  {
    tmnCode: { type: String, trim: true },
    secureSecret: { type: String, trim: true }
  },
  { _id: false }
);

const HotelPaymentConfigSchema = new mongoose.Schema(
  {
    qr: HotelPaymentQrSchema,
    vnpay: HotelPaymentVnpaySchema
  },
  { _id: false }
);

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
      checkOutTime: { type: String, default: "12:00" },
      /**
       * X: số ngày (theo lịch) tối thiểu còn lại đến ngày nhận phòng để đơn đã thanh toán được coi là đủ điều kiện hoàn tiền khi khách hủy (getGuestRefundPolicyEligibility).
       * Hủy đơn chưa thanh toán không dùng ngưỡng này. Mặc định 2.
       */
      refundMinDaysBeforeCheckIn: { type: Number, min: 0, max: 90, default: 2 }
    },
    // Không trả về mặc định trên API public; server dùng Hotel.PAYMENT_CONFIG_SELECT khi cần đọc paymentConfig (kể cả VNPay secret).
    paymentConfig: {
      type: HotelPaymentConfigSchema,
      default: undefined,
      select: false
    },
    status: {
      type: String,
      enum: ["active", "inactive", "maintenance"],
      default: "active"
    },
    /**
     * Lịch sử áp dụng giá gợi ý hàng loạt từ trang dynamic pricing (theo roomType).
     * { [roomType]: { lastBulkApplyAt, previousAvgNightly, appliedAvgNightly, daysWindow } }
     * (Bản cũ: previousAvgRegular / appliedAvgRegular — cùng ý nghĩa TB đêm, đọc tương thích trong service.)
     */
    dynamicPricingByRoomType: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
    /** Email bên dịch vụ sửa chữa — owner cấu hình; không trả về qua API guest. */
    maintenanceContactEmail: {
      type: String,
      trim: true,
      default: "",
    },
  },
  { timestamps: true }
);

const Hotel = mongoose.model("Hotel", HotelSchema);

/** Gộp vào .select() / populate — chỉ +paymentConfig (không thêm +paymentConfig.vnpay.secureSecret: MongoDB 31249 path collision). */
Hotel.PAYMENT_CONFIG_SELECT = "+paymentConfig";

module.exports = Hotel;
