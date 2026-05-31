const { body } = require("express-validator");
const { validate, mongoIdBody } = require("./common");

const EQUIPMENT_STATUSES = ["operational", "under_repair", "broken"];

const postEquipmentValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Tên thiết bị bắt buộc")
    .isLength({ max: 120 })
    .withMessage("Tên thiết bị tối đa 120 ký tự"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(EQUIPMENT_STATUSES)
    .withMessage("Trạng thái không hợp lệ"),
];

const patchEquipmentValidation = [
  body("name")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Tên thiết bị không hợp lệ")
    .isLength({ max: 120 })
    .withMessage("Tên thiết bị tối đa 120 ký tự"),
  body("status")
    .optional({ values: "falsy" })
    .isIn(EQUIPMENT_STATUSES)
    .withMessage("Trạng thái không hợp lệ"),
  body().custom((_, { req }) => {
    const { name, status } = req.body || {};
    const hasStatus = status !== undefined && status !== null && status !== "";
    const hasName = name !== undefined && name !== null;
    if (!hasStatus && !hasName) {
      throw new Error("Cần gửi name và/hoặc status");
    }
    return true;
  }),
];

const equipmentRepairRequestValidation = [
  body("items")
    .isArray({ min: 1 })
    .withMessage("Cần chọn ít nhất một thiết bị để gửi báo cáo"),
  body("items.*.roomId").isMongoId().withMessage("roomId không hợp lệ"),
  body("items.*.equipmentId").isMongoId().withMessage("equipmentId không hợp lệ"),
];

module.exports = {
  validate,
  postEquipmentValidation,
  patchEquipmentValidation,
  equipmentRepairRequestValidation,
};
