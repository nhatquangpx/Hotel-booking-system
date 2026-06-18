const { body, query } = require("express-validator");
const { validate } = require("./common");

const listReviewsQueryValidation = [
  query("rating")
    .optional({ values: "falsy" })
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating lọc phải là số từ 1 đến 5"),
];

const addReviewValidation = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating phải là số từ 1 đến 5"),
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Nội dung đánh giá không được để trống")
    .isLength({ max: 2000 })
    .withMessage("Nội dung đánh giá không được vượt quá 2000 ký tự"),
];

const updateReviewValidation = [
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating phải là số từ 1 đến 5"),
  body("comment")
    .trim()
    .notEmpty()
    .withMessage("Nội dung đánh giá không được để trống")
    .isLength({ max: 2000 })
    .withMessage("Nội dung đánh giá không được vượt quá 2000 ký tự"),
];

const replyReviewValidation = [
  body("response")
    .trim()
    .notEmpty()
    .withMessage("Nội dung phản hồi không được để trống")
    .isLength({ max: 2000 })
    .withMessage("Phản hồi tối đa 2000 ký tự"),
];

module.exports = {
  validate,
  listReviewsQueryValidation,
  addReviewValidation,
  updateReviewValidation,
  replyReviewValidation,
};
