const { body } = require("express-validator");
const { validate, PHONE_PATTERN } = require("./common");

const ROLES = ["guest", "admin", "owner", "staff"];
const STATUSES = ["active", "inactive"];

const createUserValidation = [
  body("name").trim().notEmpty().withMessage("Tên không được để trống"),
  body("email").trim().isEmail().withMessage("Email không hợp lệ"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
  body("phone")
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("Số điện thoại không hợp lệ"),
  body("role")
    .optional()
    .isIn(ROLES)
    .withMessage("Role không hợp lệ"),
  body("status")
    .optional()
    .isIn(STATUSES)
    .withMessage("Trạng thái không hợp lệ"),
  body("assignedHotelId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("assignedHotelId không hợp lệ"),
];

const updateUserValidation = [
  body("name")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Tên không được để trống"),
  body("email")
    .optional({ values: "falsy" })
    .trim()
    .isEmail()
    .withMessage("Email không hợp lệ"),
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("Số điện thoại không hợp lệ"),
  body("role")
    .optional({ values: "falsy" })
    .isIn(ROLES)
    .withMessage("Role không hợp lệ"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(STATUSES)
    .withMessage("Trạng thái không hợp lệ"),
  body("assignedHotelId")
    .optional({ nullable: true })
    .custom((value) => value === null || value === "" || /^[a-fA-F0-9]{24}$/.test(String(value)))
    .withMessage("assignedHotelId không hợp lệ"),
  body("password")
    .optional({ values: "falsy" })
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự"),
];

module.exports = {
  validate,
  createUserValidation,
  updateUserValidation,
};
