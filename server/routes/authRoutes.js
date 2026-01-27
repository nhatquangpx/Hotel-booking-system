const express = require("express");
const router = express.Router();
const { register, login, forgotPassword, resetPassword, verify2FA, resend2FAOTP } = require("../controllers/authController");
const { enable2FA, disable2FA, get2FAStatus, regenerateBackupCodes, getTrustedDevices, removeTrustedDevice, removeAllTrustedDevices } = require("../controllers/twoFactorController");
const { registerValidation, validate } = require("../validations/registerValidation");
const { authenticate } = require("../middlewares/authentication");

// Routes
router.post("/register", registerValidation, validate, register);
router.post("/login", login);
router.post("/forgotpassword", forgotPassword);
router.post("/resetpassword", authenticate, resetPassword);

// 2FA Routes
router.post("/verify-2fa", verify2FA);
router.post("/resend-2fa-otp", resend2FAOTP);

// 2FA Settings (requires authentication)
router.get("/2fa/status", authenticate, get2FAStatus);
router.post("/2fa/enable", authenticate, enable2FA);
router.post("/2fa/disable", authenticate, disable2FA);
router.post("/2fa/regenerate-backup-codes", authenticate, regenerateBackupCodes);

// Trusted Devices (requires authentication)
router.get("/2fa/trusted-devices", authenticate, getTrustedDevices);
router.post("/2fa/trusted-devices/remove", authenticate, removeTrustedDevice);
router.post("/2fa/trusted-devices/remove-all", authenticate, removeAllTrustedDevices);

module.exports = router;
