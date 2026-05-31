const { body } = require("express-validator");
const { validate, PHONE_PATTERN } = require("./common");

const submitContactValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Họ tên không được để trống")
    .isLength({ max: 100 })
    .withMessage("Họ tên tối đa 100 ký tự"),
  body("email")
    .trim()
    .isEmail()
    .withMessage("Email không hợp lệ")
    .isLength({ max: 150 })
    .withMessage("Email tối đa 150 ký tự"),
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("Số điện thoại không hợp lệ")
    .isLength({ max: 30 })
    .withMessage("Số điện thoại tối đa 30 ký tự"),
  body("subject")
    .trim()
    .notEmpty()
    .withMessage("Tiêu đề không được để trống")
    .isLength({ max: 150 })
    .withMessage("Tiêu đề tối đa 150 ký tự"),
  body("message")
    .trim()
    .notEmpty()
    .withMessage("Nội dung không được để trống")
    .isLength({ max: 3000 })
    .withMessage("Nội dung tối đa 3000 ký tự"),
];

const replyContactValidation = [
  body("replyMessage")
    .trim()
    .notEmpty()
    .withMessage("Vui lòng nhập nội dung phản hồi")
    .isLength({ max: 3000 })
    .withMessage("Nội dung phản hồi tối đa 3000 ký tự"),
];

module.exports = {
  validate,
  submitContactValidation,
  replyContactValidation,
};
