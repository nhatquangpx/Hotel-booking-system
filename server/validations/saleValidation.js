const { body, query, param } = require("express-validator");
const { validate, mongoIdBody } = require("./common");
const { ROOM_TYPES } = require("./roomValidation");
const { parseOptionalBoolean } = require("../utils/parseBoolean");

const SALE_SCOPES = ["hotel", "room_type"];
const DATE_YMD = /^\d{4}-\d{2}-\d{2}$/;

function parseSalePayload(body, { partial = false } = {}) {
  const { hotelId, title, scope, roomType, startDate, endDate, discountPercent, isActive } =
    body || {};

  const out = {};
  if (!partial || hotelId !== undefined) out.hotelId = hotelId;
  if (!partial || title !== undefined) out.title = title != null ? String(title).trim() : "";
  if (!partial || scope !== undefined) out.scope = scope;
  if (!partial || roomType !== undefined) out.roomType = roomType;
  if (!partial || startDate !== undefined) out.startDate = startDate;
  if (!partial || endDate !== undefined) out.endDate = endDate;
  if (!partial || discountPercent !== undefined) out.discountPercent = discountPercent;
  if (isActive !== undefined) out.isActive = isActive;

  return out;
}

function normalizePayloadIsActive(payload) {
  if (payload.isActive === undefined) return null;
  const parsed = parseOptionalBoolean(payload.isActive);
  if (parsed === null) {
    return "isActive phải là true hoặc false";
  }
  payload.isActive = parsed;
  return null;
}

function validateSalePayload(payload, { partial = false } = {}) {
  if (!partial) {
    const discountMissing =
      payload.discountPercent === undefined ||
      payload.discountPercent === null ||
      payload.discountPercent === "";
    if (!payload.hotelId || !payload.scope || !payload.startDate || !payload.endDate || discountMissing) {
      return "Thiếu thông tin bắt buộc";
    }
    if (!payload.title) {
      return "Tên chương trình không được để trống";
    }
  }

  if (payload.discountPercent !== undefined && payload.discountPercent !== null) {
    const pct = Number(payload.discountPercent);
    if (!Number.isFinite(pct)) return "Phần trăm giảm giá phải là số hợp lệ";
    if (pct < 1 || pct > 100) return "Phần trăm giảm giá phải từ 1 đến 100";
    payload.discountPercent = pct;
  }

  if (payload.startDate != null && payload.endDate != null && payload.endDate < payload.startDate) {
    return "Ngày kết thúc phải sau hoặc bằng ngày bắt đầu";
  }

  if (payload.scope === "room_type" && !payload.roomType) {
    return "Cần chọn loại phòng khi phạm vi là loại phòng";
  }

  return normalizePayloadIsActive(payload);
}

const saleHotelIdQueryValidation = [
  query("hotelId").isMongoId().withMessage("hotelId không hợp lệ"),
];

const createSaleValidation = [
  mongoIdBody("hotelId", "hotelId"),
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Tên chương trình không được để trống")
    .isLength({ max: 200 })
    .withMessage("Tên chương trình tối đa 200 ký tự"),
  body("scope")
    .isIn(SALE_SCOPES)
    .withMessage("scope không hợp lệ"),
  body("roomType")
    .optional({ values: "falsy" })
    .isIn(ROOM_TYPES)
    .withMessage("roomType không hợp lệ"),
  body("startDate")
    .matches(DATE_YMD)
    .withMessage("startDate phải có dạng YYYY-MM-DD"),
  body("endDate")
    .matches(DATE_YMD)
    .withMessage("endDate phải có dạng YYYY-MM-DD"),
  body("discountPercent")
    .isFloat({ min: 1, max: 100 })
    .withMessage("Phần trăm giảm giá phải từ 1 đến 100"),
  body("isActive").optional(),
  body().custom((_, { req }) => {
    if (req.body.scope === "room_type" && !req.body.roomType) {
      throw new Error("Cần chọn loại phòng khi phạm vi là loại phòng");
    }
    if (req.body.startDate && req.body.endDate && req.body.endDate < req.body.startDate) {
      throw new Error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
    }
    return true;
  }),
];

const updateSaleValidation = [
  body("title")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Tên chương trình không được để trống")
    .isLength({ max: 200 })
    .withMessage("Tên chương trình tối đa 200 ký tự"),
  body("scope").optional().isIn(SALE_SCOPES).withMessage("scope không hợp lệ"),
  body("roomType")
    .optional({ values: "falsy" })
    .isIn(ROOM_TYPES)
    .withMessage("roomType không hợp lệ"),
  body("startDate")
    .optional()
    .matches(DATE_YMD)
    .withMessage("startDate phải có dạng YYYY-MM-DD"),
  body("endDate")
    .optional()
    .matches(DATE_YMD)
    .withMessage("endDate phải có dạng YYYY-MM-DD"),
  body("discountPercent")
    .optional()
    .isFloat({ min: 1, max: 100 })
    .withMessage("Phần trăm giảm giá phải từ 1 đến 100"),
  body("isActive").optional(),
  body().custom((_, { req }) => {
    const start = req.body.startDate;
    const end = req.body.endDate;
    if (start && end && end < start) {
      throw new Error("Ngày kết thúc phải sau hoặc bằng ngày bắt đầu");
    }
    return true;
  }),
];

const setSaleStatusValidation = [
  body("isActive")
    .exists()
    .withMessage("isActive là bắt buộc")
    .custom((value) => {
      const parsed = parseOptionalBoolean(value);
      if (parsed === null) {
        throw new Error("isActive phải là true hoặc false");
      }
      return true;
    }),
];

const saleIdParamValidation = [
  param("id").isMongoId().withMessage("ID không hợp lệ"),
];

module.exports = {
  validate,
  parseSalePayload,
  validateSalePayload,
  normalizePayloadIsActive,
  saleHotelIdQueryValidation,
  createSaleValidation,
  updateSaleValidation,
  setSaleStatusValidation,
  saleIdParamValidation,
};
