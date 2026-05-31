const { body, query } = require("express-validator");
const { validate, mongoIdBody } = require("./common");
const { ROOM_TYPES } = require("./roomValidation");

const dynamicPricingQueryValidation = [
  query("hotelId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("hotelId không hợp lệ"),
  query("days")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 365 })
    .withMessage("days phải từ 1 đến 365"),
];

const applySuggestedPricesValidation = [
  mongoIdBody("hotelId", "hotelId"),
  body("roomType")
    .trim()
    .isIn(ROOM_TYPES)
    .withMessage("roomType không hợp lệ"),
  body("days")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 365 })
    .withMessage("days phải từ 1 đến 365"),
];

module.exports = {
  validate,
  dynamicPricingQueryValidation,
  applySuggestedPricesValidation,
};
