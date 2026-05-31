const { validationResult, param, body } = require("express-validator");

const PHONE_PATTERN = /^[0-9+\-\s().]{8,20}$/;

/**
 * Middleware — trả 400 + message (lỗi đầu tiên) và errors[] (express-validator).
 */
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const first = errors.array()[0];
    return res.status(400).json({
      message: first?.msg || "Dữ liệu không hợp lệ",
      errors: errors.array(),
    });
  }
  next();
}

function mongoIdParam(field, label = "ID") {
  return param(field).isMongoId().withMessage(`${label} không hợp lệ`);
}

function mongoIdBody(field, label = "ID", options = {}) {
  const chain = body(field).isMongoId().withMessage(`${label} không hợp lệ`);
  if (options.optional) {
    return chain.optional({ values: "falsy" });
  }
  return chain;
}

function trimBody(fields) {
  return fields.map((field) =>
    body(field)
      .optional({ values: "falsy" })
      .trim()
  );
}

module.exports = {
  validate,
  mongoIdParam,
  mongoIdBody,
  trimBody,
  PHONE_PATTERN,
};
