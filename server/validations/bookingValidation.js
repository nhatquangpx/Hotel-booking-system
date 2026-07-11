const mongoose = require("mongoose");
const { body, query } = require("express-validator");
const { validate } = require("./common");

const mongoIdQuery = (field, label = "ID") =>
  query(field).isMongoId().withMessage(`${label} không hợp lệ`);

/** Client đặt phòng gửi `hotel` / `room`; một số API dùng `hotelId` / `roomId`. */
function requireMongoIdFromBody(fields, label) {
  return body().custom((_, { req }) => {
    const raw = fields.map((f) => req.body?.[f]).find((v) => v != null && v !== "");
    if (!raw || !mongoose.isValidObjectId(String(raw))) {
      throw new Error(`${label} không hợp lệ`);
    }
    return true;
  });
}

const PAYMENT_METHODS = ["qr_code", "vnpay"];

const bookingStayDateQueryValidation = [
  query("checkInDate")
    .notEmpty()
    .withMessage("checkInDate là bắt buộc")
    .isISO8601()
    .withMessage("checkInDate không hợp lệ"),
  query("checkOutDate")
    .notEmpty()
    .withMessage("checkOutDate là bắt buộc")
    .isISO8601()
    .withMessage("checkOutDate không hợp lệ"),
];

/** GET /bookings/available-rooms?hotelId&checkInDate&checkOutDate */
const availableRoomsQueryValidation = [
  mongoIdQuery("hotelId", "hotelId"),
  ...bookingStayDateQueryValidation,
];

/** GET /bookings/price-preview?hotelId&roomId&checkInDate&checkOutDate */
const pricePreviewQueryValidation = [
  mongoIdQuery("hotelId", "hotelId"),
  mongoIdQuery("roomId", "roomId"),
  ...bookingStayDateQueryValidation,
  query("guestCount")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 50 })
    .withMessage("guestCount phải từ 1 đến 50"),
  query("selectedAddonIds")
    .optional({ values: "falsy" })
    .custom((value) => {
      if (value == null || value === "") return true;
      const ids = Array.isArray(value) ? value : String(value).split(",");
      return ids.every((id) => mongoose.isValidObjectId(String(id).trim()));
    })
    .withMessage("selectedAddonIds chứa ID không hợp lệ"),
];

const createBookingValidation = [
  requireMongoIdFromBody(["hotel", "hotelId"], "hotelId"),
  requireMongoIdFromBody(["room", "roomId"], "roomId"),
  body("checkInDate")
    .notEmpty()
    .withMessage("checkInDate là bắt buộc")
    .isISO8601()
    .withMessage("checkInDate không hợp lệ"),
  body("checkOutDate")
    .notEmpty()
    .withMessage("checkOutDate là bắt buộc")
    .isISO8601()
    .withMessage("checkOutDate không hợp lệ"),
  body("paymentMethod")
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage(`paymentMethod phải là ${PAYMENT_METHODS.join(" hoặc ")}`),
  body("specialRequests")
    .optional({ values: "falsy" })
    .isString()
    .isLength({ max: 2000 })
    .withMessage("specialRequests tối đa 2000 ký tự"),
  body("guestCount")
    .notEmpty()
    .withMessage("guestCount là bắt buộc")
    .isInt({ min: 1, max: 50 })
    .withMessage("guestCount phải từ 1 đến 50"),
  body("guestIdNumber")
    .notEmpty()
    .withMessage("Số CCCD/CMND là bắt buộc")
    .customSanitizer((value) => String(value || "").replace(/\s+/g, "").trim())
    .matches(/^\d{9}$|^\d{12}$/)
    .withMessage("Số CCCD/CMND phải gồm 9 hoặc 12 chữ số"),
  body("selectedAddonIds")
    .optional()
    .customSanitizer((value) => {
      if (Array.isArray(value)) return value;
      if (typeof value === "string" && value.trim()) {
        try {
          const parsed = JSON.parse(value);
          if (Array.isArray(parsed)) return parsed;
        } catch {
          /* ignore */
        }
        return value.split(",").map((id) => id.trim()).filter(Boolean);
      }
      return [];
    })
    .isArray()
    .withMessage("selectedAddonIds phải là mảng"),
  body("selectedAddonIds.*")
    .optional()
    .isMongoId()
    .withMessage("selectedAddonIds chứa ID không hợp lệ"),
];

const cancelBookingValidation = [
  body("cancellationReason")
    .optional({ values: "falsy" })
    .isString()
    .isLength({ max: 1000 })
    .withMessage("cancellationReason tối đa 1000 ký tự"),
  body("refundBankAccountName")
    .optional({ values: "falsy" })
    .isString()
    .isLength({ max: 120 })
    .withMessage("refundBankAccountName tối đa 120 ký tự"),
  body("refundBankAccountNumber")
    .optional({ values: "falsy" })
    .isString()
    .isLength({ max: 50 })
    .withMessage("refundBankAccountNumber tối đa 50 ký tự"),
  body("refundBankName")
    .optional({ values: "falsy" })
    .isString()
    .isLength({ max: 120 })
    .withMessage("refundBankName tối đa 120 ký tự"),
];

const ownerUpdateBookingStatusValidation = [
  body("status")
    .notEmpty()
    .withMessage("status là bắt buộc")
    .isIn(["pending", "paid", "cancelled"])
    .withMessage("status không hợp lệ"),
];

const optionalIsoDateQuery = (field) =>
  query(field)
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage(`${field} không hợp lệ`);

/** GET /guest/bookings — danh sách đặt phòng của khách */
const guestMyBookingsQueryValidation = [
  query("hotelId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("hotelId không hợp lệ"),
  optionalIsoDateQuery("startDate"),
  optionalIsoDateQuery("endDate"),
  query("page")
    .optional({ values: "falsy" })
    .isInt({ min: 1 })
    .withMessage("page phải là số nguyên dương"),
  query("limit")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 100 })
    .withMessage("limit phải từ 1 đến 100"),
];

const ownerRejectQrPaymentValidation = [
  body("rejectionType")
    .notEmpty()
    .withMessage("rejectionType là bắt buộc")
    .isIn(["invalid_proof", "payment_not_successful"])
    .withMessage("rejectionType phải là invalid_proof hoặc payment_not_successful"),
];

const ownerReopenBookingValidation = [
  body("reason")
    .optional({ values: "falsy" })
    .isString()
    .isLength({ max: 500 })
    .withMessage("reason tối đa 500 ký tự"),
];

module.exports = {
  validate,
  availableRoomsQueryValidation,
  pricePreviewQueryValidation,
  createBookingValidation,
  cancelBookingValidation,
  ownerUpdateBookingStatusValidation,
  ownerRejectQrPaymentValidation,
  ownerReopenBookingValidation,
  guestMyBookingsQueryValidation,
};
