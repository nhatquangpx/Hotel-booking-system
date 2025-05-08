const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword} = require("../controllers/authController");
const { registerValidation, validate } = require("../validations/registerValidation");
const { verifyToken } = require("../middlewares/authMiddleware");
// Routes
router.post("/register", registerValidation, validate, register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword", verifyToken, resetPassword);

module.exports = router;
