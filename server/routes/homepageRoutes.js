const express = require("express");
const router = express.Router();
const { adminAccess, staffAccess, userAccess } = require("../controllers/homepageController");
const { verifyToken, verifyRole } = require("../middlewares/authMiddleware");

// Routes
router.get("/admin", verifyToken, verifyRole(["admin"]), adminAccess);
router.get("/staff", verifyToken, verifyRole(["staff", "admin"]), staffAccess);
router.get("/", verifyToken, userAccess);

modules.exports = router;