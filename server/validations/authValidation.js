const { body } = require("express-validator");
const { validate, PHONE_PATTERN } = require("./common");

const registerValidation = [
  body("name").trim().notEmpty().withMessage("Tên không được để trống"),
  body("email").trim().isEmail().withMessage("Email không hợp lệ"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("phone")
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("Số điện thoại không hợp lệ"),
];

const loginValidation = [
  body("email").trim().isEmail().withMessage("Email không hợp lệ"),
  body("password").notEmpty().withMessage("Mật khẩu không được để trống"),
];

const forgotPasswordValidation = [
  body("email").trim().isEmail().withMessage("Email không hợp lệ"),
];

const resetPasswordValidation = [
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự"),
];

const verify2FAValidation = [
  body("userId").isMongoId().withMessage("userId không hợp lệ"),
  body("otpCode").trim().notEmpty().withMessage("Mã OTP không được để trống"),
  body("rememberDevice").optional().isBoolean().withMessage("rememberDevice phải là boolean"),
];

const resend2FAOTPValidation = [
  body("userId").isMongoId().withMessage("userId không hợp lệ"),
];

const removeTrustedDeviceValidation = [
  body("deviceId").trim().notEmpty().withMessage("deviceId không được để trống"),
];

module.exports = {
  validate,
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verify2FAValidation,
  resend2FAOTPValidation,
  removeTrustedDeviceValidation,
};
