const { body } = require("express-validator");
const { validate, PHONE_PATTERN } = require("./common");

const updateSelfProfileValidation = [
  body("name")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Họ và tên không được để trống"),
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("Số điện thoại không hợp lệ"),
  body().custom((_, { req }) => {
    const allowed = ["name", "phone"];
    const hasUpdateField = allowed.some((k) =>
      Object.prototype.hasOwnProperty.call(req.body || {}, k)
    );
    if (!hasUpdateField) {
      throw new Error("Chỉ được cập nhật họ tên và số điện thoại");
    }
    const extra = Object.keys(req.body || {}).filter((k) => {
      if (allowed.includes(k)) return false;
      const v = req.body[k];
      if (v === undefined || v === null || v === "") return false;
      return true;
    });
    if (extra.length) {
      throw new Error("Chỉ được cập nhật họ tên và số điện thoại");
    }
    return true;
  }),
];

/** Guest: được cập nhật thêm CCCD (số + ảnh 2 mặt qua multipart). */
const updateGuestProfileValidation = [
  body("name")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Họ và tên không được để trống"),
  body("phone")
    .optional({ values: "falsy" })
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("Số điện thoại không hợp lệ"),
  body("idNumber")
    .optional({ values: "falsy" })
    .customSanitizer((value) => String(value || "").replace(/\s+/g, "").trim())
    .custom((value) => {
      if (!value) return true;
      if (!/^\d{9}$|^\d{12}$/.test(value)) {
        throw new Error("Số CCCD/CMND phải gồm 9 hoặc 12 chữ số");
      }
      return true;
    }),
  body().custom((_, { req }) => {
    const allowed = ["name", "phone", "idNumber"];
    const hasFiles =
      Boolean(req.files?.idImageFront?.[0]) || Boolean(req.files?.idImageBack?.[0]);
    const hasUpdateField =
      allowed.some((k) => Object.prototype.hasOwnProperty.call(req.body || {}, k)) ||
      hasFiles;
    if (!hasUpdateField) {
      throw new Error("Chỉ được cập nhật họ tên, số điện thoại và CCCD");
    }
    const extra = Object.keys(req.body || {}).filter((k) => {
      if (allowed.includes(k)) return false;
      const v = req.body[k];
      if (v === undefined || v === null || v === "") return false;
      return true;
    });
    if (extra.length) {
      throw new Error("Chỉ được cập nhật họ tên, số điện thoại và CCCD");
    }
    return true;
  }),
];

const changePasswordValidation = [
  body("currentPassword")
    .notEmpty()
    .withMessage("Vui lòng nhập mật khẩu hiện tại"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự"),
];

module.exports = {
  validate,
  updateSelfProfileValidation,
  updateGuestProfileValidation,
  changePasswordValidation,
};
