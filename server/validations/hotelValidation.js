const { body } = require("express-validator");
const { validate, PHONE_PATTERN } = require("./common");

const HOTEL_STATUSES = ["active", "inactive", "maintenance"];

function readBodyField(req, flatKey, nestedKey) {
  const flat = req.body?.[flatKey];
  if (flat != null && String(flat).trim() !== "") {
    return String(flat).trim();
  }
  const parts = nestedKey.split(".");
  let cur = req.body;
  for (const p of parts) {
    cur = cur?.[p];
  }
  if (cur == null) return "";
  return String(cur).trim();
}

function addressCustom(required) {
  return body().custom((_, { req }) => {
    const city = readBodyField(req, "address[city]", "address.city");
    const street = readBodyField(req, "address[street]", "address.street");
    const number = readBodyField(req, "address[number]", "address.number");
    if (!required && !city && !street && !number) return true;
    if (!city || !street || !number) {
      throw new Error(
        required
          ? "Địa chỉ (số nhà, đường, thành phố) là bắt buộc"
          : "Địa chỉ phải có đủ số nhà, đường và thành phố"
      );
    }
    return true;
  });
}

function contactCustom(required) {
  return body().custom((_, { req }) => {
    const phone = readBodyField(req, "contactInfo[phone]", "contactInfo.phone");
    const email = readBodyField(req, "contactInfo[email]", "contactInfo.email");
    if (!required && !phone && !email) return true;
    if (required && !phone) {
      throw new Error("Số điện thoại liên hệ không được để trống");
    }
    if (phone && !PHONE_PATTERN.test(phone)) {
      throw new Error("Số điện thoại liên hệ không hợp lệ");
    }
    if (required && !email) {
      throw new Error("Email liên hệ không được để trống");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("Email liên hệ không hợp lệ");
    }
    return true;
  });
}

const starRatingRule = (optional) => {
  const chain = body("starRating").custom((value) => {
    if (optional && (value === undefined || value === null || value === "")) {
      return true;
    }
    const n = parseInt(value, 10);
    if (Number.isNaN(n) || n < 1 || n > 5) {
      throw new Error("Đánh giá sao phải là số từ 1 đến 5");
    }
    return true;
  });
  return optional ? chain : chain;
};

/** Admin POST /hotels — sau multer */
const createAdminHotelValidation = [
  body("name").trim().notEmpty().withMessage("Tên khách sạn không được để trống"),
  body("ownerId").isMongoId().withMessage("ID chủ sở hữu không hợp lệ"),
  body("description").trim().notEmpty().withMessage("Mô tả không được để trống"),
  starRatingRule(false),
  addressCustom(true),
  contactCustom(true),
  body("status")
    .optional()
    .isIn(HOTEL_STATUSES)
    .withMessage("Trạng thái khách sạn không hợp lệ"),
];

/** Admin/Owner PUT /hotels/:id — sau multer, mọi field tùy chọn */
const updateHotelValidation = [
  body("name")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Tên khách sạn không được để trống"),
  body("description")
    .optional({ values: "falsy" })
    .trim()
    .notEmpty()
    .withMessage("Mô tả không được để trống"),
  body("ownerId")
    .optional({ values: "falsy" })
    .isMongoId()
    .withMessage("ID chủ sở hữu không hợp lệ"),
  starRatingRule(true),
  addressCustom(false),
  contactCustom(false),
  body("status")
    .optional({ values: "falsy" })
    .isIn(HOTEL_STATUSES)
    .withMessage("Trạng thái khách sạn không hợp lệ"),
  body("policies.refundMinDaysBeforeCheckIn")
    .optional()
    .isInt({ min: 0, max: 90 })
    .withMessage("Số ngày hoàn tiền tối thiểu phải từ 0 đến 90"),
];

const maintenanceContactValidation = [
  body("maintenanceContactEmail")
    .optional({ nullable: true })
    .custom((value) => {
      if (value === null || value === undefined) return true;
      const trimmed = String(value).trim();
      if (!trimmed) return true;
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
        throw new Error("Địa chỉ email không hợp lệ");
      }
      return true;
    }),
];

module.exports = {
  validate,
  createAdminHotelValidation,
  updateHotelValidation,
  maintenanceContactValidation,
};
