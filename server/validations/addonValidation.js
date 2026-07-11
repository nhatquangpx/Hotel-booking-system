const { body, query } = require("express-validator");
const { ADDON_CATEGORIES, ADDON_PRICING_UNITS } = require("../models/HotelAddonService");
const { validate } = require("./common");

/**
 * Chuẩn hóa body addon trước khi validate (trim, Number, default).
 * @param {object} raw
 * @param {{ partial?: boolean }} [options] — update chỉ parse field được gửi
 */
function parseAddonPayload(raw, { partial = false } = {}) {
  const body = raw || {};
  const out = {};

  if (!partial || body.hotelId !== undefined) {
    out.hotelId = body.hotelId;
  }
  if (!partial || body.name !== undefined) {
    out.name = body.name != null ? String(body.name).trim() : "";
  }
  if (!partial || body.description !== undefined) {
    out.description = body.description != null ? String(body.description).trim() : "";
  }
  if (!partial || body.price !== undefined) {
    out.price = Number(body.price);
  }
  if (!partial || body.category !== undefined) {
    out.category = body.category || "other";
  }
  if (!partial || body.pricingUnit !== undefined) {
    out.pricingUnit = body.pricingUnit || "per_stay";
  }
  if (!partial) {
    out.isActive = body.isActive !== false;
  } else if (body.isActive !== undefined) {
    out.isActive = body.isActive === true || body.isActive === "true";
  }

  return out;
}

function parseCreateAddonBody(req, _res, next) {
  req.body = parseAddonPayload(req.body, { partial: false });
  next();
}

function parseUpdateAddonBody(req, _res, next) {
  req.body = parseAddonPayload(req.body, { partial: true });
  next();
}

const addonHotelIdQueryValidation = [
  query("hotelId").notEmpty().withMessage("hotelId là bắt buộc").isMongoId().withMessage("hotelId không hợp lệ"),
];

const createAddonValidation = [
  parseCreateAddonBody,
  body("hotelId").notEmpty().withMessage("hotelId là bắt buộc").isMongoId().withMessage("hotelId không hợp lệ"),
  body("name")
    .notEmpty()
    .withMessage("Tên dịch vụ là bắt buộc")
    .isString()
    .isLength({ max: 120 })
    .withMessage("Tên dịch vụ tối đa 120 ký tự"),
  body("description").optional({ values: "falsy" }).isString().isLength({ max: 500 }),
  body("price").isFloat({ min: 0 }).withMessage("Giá phải là số không âm"),
  body("category")
    .optional()
    .isIn(ADDON_CATEGORIES)
    .withMessage(`category phải là một trong: ${ADDON_CATEGORIES.join(", ")}`),
  body("pricingUnit")
    .optional()
    .isIn(ADDON_PRICING_UNITS)
    .withMessage(`pricingUnit phải là một trong: ${ADDON_PRICING_UNITS.join(", ")}`),
  body("isActive").optional().isBoolean().withMessage("isActive phải là boolean"),
];

const updateAddonValidation = [
  parseUpdateAddonBody,
  body("name").optional().isString().isLength({ min: 1, max: 120 }),
  body("description").optional({ values: "falsy" }).isString().isLength({ max: 500 }),
  body("price").optional().isFloat({ min: 0 }),
  body("category").optional().isIn(ADDON_CATEGORIES),
  body("pricingUnit").optional().isIn(ADDON_PRICING_UNITS),
  body("isActive").optional().isBoolean(),
];

const setAddonStatusValidation = [
  body("isActive").isBoolean().withMessage("isActive là bắt buộc và phải là boolean"),
];

const addonStaffHotelIdQueryValidation = [
  query("hotelId").optional({ values: "falsy" }).isMongoId().withMessage("hotelId không hợp lệ"),
];

module.exports = {
  validate,
  parseAddonPayload,
  parseCreateAddonBody,
  parseUpdateAddonBody,
  addonHotelIdQueryValidation,
  addonStaffHotelIdQueryValidation,
  createAddonValidation,
  updateAddonValidation,
  setAddonStatusValidation,
};
