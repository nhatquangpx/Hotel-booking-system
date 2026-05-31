const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword, verify2FA, resend2FAOTP, getMe, logout, refreshToken } = require("../controllers/authController");
const { enable2FA, disable2FA, get2FAStatus, regenerateBackupCodes, getTrustedDevices, removeTrustedDevice, removeAllTrustedDevices } = require("../controllers/twoFactorController");
const {
  registerValidation,
  loginValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verify2FAValidation,
  resend2FAOTPValidation,
  removeTrustedDeviceValidation,
  validate,
} = require("../validations/authValidation");
const { authenticate } = require("../middlewares/authentication");

router.post("/register", registerValidation, validate, register);
router.post("/login", loginValidation, validate, login);
router.post("/refresh", refreshToken);
router.post("/logout", logout);
router.get("/me", authenticate, getMe);
router.post("/forgotpassword", forgotPasswordValidation, validate, forgotPassword);
router.post("/resetpassword", authenticate, resetPasswordValidation, validate, resetPassword);

router.post("/verify-2fa", verify2FAValidation, validate, verify2FA);
router.post("/resend-2fa-otp", resend2FAOTPValidation, validate, resend2FAOTP);

router.get("/2fa/status", authenticate, get2FAStatus);
router.post("/2fa/enable", authenticate, enable2FA);
router.post("/2fa/disable", authenticate, disable2FA);
router.post("/2fa/regenerate-backup-codes", authenticate, regenerateBackupCodes);

router.get("/2fa/trusted-devices", authenticate, getTrustedDevices);
router.post("/2fa/trusted-devices/remove", authenticate, removeTrustedDeviceValidation, validate, removeTrustedDevice);
router.post("/2fa/trusted-devices/remove-all", authenticate, removeAllTrustedDevices);

module.exports = router;
