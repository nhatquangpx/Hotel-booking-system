const { body } = require("express-validator");
const { validate, mongoIdBody } = require("./common");
const { ROOM_TYPES } = require("../services/rooms/roomTypes");
const ROOM_STATUSES = ["active", "maintenance", "inactive"];

/** FormData: price là số hoặc chuỗi số. */
function parseRoomPrice(value) {
  if (value === undefined || value === null || value === "") {
    return null;
  }
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    return Number(value.trim());
  }
  return Number(value);
}

function roomPriceValidation({ optional = false } = {}) {
  const chain = body("price").custom((value) => {
    if (optional && (value === undefined || value === null || value === "")) {
      return true;
    }
    const price = parseRoomPrice(value);
    if (Number.isNaN(price) || price <= 0) {
      throw new Error("Giá phòng phải là số dương hợp lệ");
    }
    return true;
  });
  return optional ? chain.optional({ values: "falsy" }) : chain;
}

function positiveNumberField(field, label, { optional = false, integer = false } = {}) {
  const chain = body(field).custom((value) => {
    if (optional && (value === undefined || value === null || value === "")) {
      return true;
    }
    const n = Number(value);
    if (Number.isNaN(n) || n <= 0) {
      throw new Error(`${label} phải là số dương hợp lệ`);
    }
    if (integer && !Number.isInteger(n)) {
      throw new Error(`${label} phải là số nguyên dương`);
    }
    return true;
  });
  return optional ? chain.optional({ values: "falsy" }) : chain;
}

const createRoomBodyValidation = [
  body("roomNumber").trim().notEmpty().withMessage("Số phòng không được để trống"),
  body("type")
    .trim()
    .isIn(ROOM_TYPES)
    .withMessage(`Loại phòng phải là một trong: ${ROOM_TYPES.join(", ")}`),
  body("description").trim().notEmpty().withMessage("Mô tả không được để trống"),
  roomPriceValidation(),
  positiveNumberField("maxPeople", "Số người tối đa", { integer: true }),
  body("roomStatus")
    .optional({ values: "falsy" })
    .isIn(ROOM_STATUSES)
    .withMessage("Trạng thái phòng không hợp lệ"),
  body("facilities").optional(),
];

/** Admin POST /rooms — hotelId trong body */
const adminCreateRoomValidation = [
  mongoIdBody("hotelId", "hotelId"),
  ...createRoomBodyValidation,
];

/** Owner POST /hotels/:hotelId/rooms — hotelId từ params */
const ownerCreateRoomValidation = [...createRoomBodyValidation];

/** PUT /rooms/:id — sau multer */
const updateRoomValidation = [
  body("roomNumber")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Số phòng không được để trống"),
  body("type")
    .optional({ values: "falsy" })
    .trim()
    .isIn(ROOM_TYPES)
    .withMessage(`Loại phòng phải là một trong: ${ROOM_TYPES.join(", ")}`),
  body("description")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Mô tả không được để trống"),
  roomPriceValidation({ optional: true }),
  positiveNumberField("maxPeople", "Số người tối đa", { optional: true, integer: true }),
  body("roomStatus")
    .optional({ values: "falsy" })
    .isIn(ROOM_STATUSES)
    .withMessage("Trạng thái phòng không hợp lệ"),
  body("facilities").optional(),
];

const updateRoomStatusValidation = [
  body("roomStatus")
    .notEmpty()
    .withMessage("roomStatus là bắt buộc")
    .isIn(ROOM_STATUSES)
    .withMessage("Trạng thái phòng không hợp lệ"),
];

module.exports = {
  validate,
  adminCreateRoomValidation,
  ownerCreateRoomValidation,
  updateRoomValidation,
  updateRoomStatusValidation,
  ROOM_TYPES,
};
