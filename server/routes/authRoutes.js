const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword} = require("../controllers/authController");
const { 
  registerValidation, 
  loginValidation, 
  validate 
} = require("../validations/registerValidation");
const { verifyToken } = require("../middlewares/authMiddleware");

// Routes đăng ký và đăng nhập
router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);

// Routes quên mật khẩu và đặt lại mật khẩu
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword", verifyToken, resetPassword);

module.exports = router;
