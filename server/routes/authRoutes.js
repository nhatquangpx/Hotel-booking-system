const express = require("express");
const router = express.Router();
const multer = require("multer");
const { register, login, adminAccess, staffAccess, userAccess } = require("../controllers/authController");
const { verifyToken, verifyRole } = require("../middleware/authMiddleware");

// Cấu hình Multer để lưu ảnh đại diện
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, "public/uploads/"),
    filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// Routes
router.post("/register", upload.single("profileImage"), register);
router.post("/login", login);
router.get("/admin", verifyToken, verifyRole(["admin"]), adminAccess);
router.get("/staff", verifyToken, verifyRole(["staff", "admin"]), staffAccess);
router.get("/", verifyToken, userAccess);

module.exports = router;
