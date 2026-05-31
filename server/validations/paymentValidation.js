const mongoose = require("mongoose");
const { body } = require("express-validator");
const { validate, mongoIdBody } = require("./common");

function requireBookingIdFromBody() {
  return body().custom((_, { req }) => {
    const raw = req.body?.bookingId ?? req.body?.booking;
    if (raw == null || raw === "") {
      throw new Error("bookingId là bắt buộc");
    }
    if (!mongoose.isValidObjectId(String(raw))) {
      throw new Error("bookingId không hợp lệ");
    }
    return true;
  });
}

const createVNPayUrlValidation = [
  mongoIdBody("bookingId", "bookingId"),
];

/** Sau uploadPaymentProof (multipart) — bookingId nằm trong req.body */
const confirmQrPaymentValidation = [requireBookingIdFromBody()];

module.exports = {
  validate,
  createVNPayUrlValidation,
  confirmQrPaymentValidation,
};
