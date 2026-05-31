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

module.exports = {
  validate,
  availableRoomsQueryValidation,
  pricePreviewQueryValidation,
  createBookingValidation,
  cancelBookingValidation,
  ownerUpdateBookingStatusValidation,
};
