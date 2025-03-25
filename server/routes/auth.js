const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const User = require('../models/User');

// Cấu hình Multer để lưu ảnh đại diện
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, "public/uploads/");
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = multer({ storage });

/* USER REGISTER */
router.post("/register", upload.single("profileImage"), async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;
        const profileImagePath = req.file ? `/uploads/${req.file.filename}` : "";

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Người dùng đã tồn tại!" });
        }

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName,
            lastName,
            email,
            password: hashPassword,
            role: role || "user",
            profileImagePath
        });

        await newUser.save();
        res.status(201).json({ message: "Đăng ký thành công!", user: newUser });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Đăng ký thất bại!", error: err.message });
    }
});

/* USER LOGIN */
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Người dùng không tồn tại!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu không chính xác!" });
        }

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "7d" }
        );

        res.status(200).json({
            token,
            user: { id: user._id, email: user.email, role: user.role, profileImagePath: user.profileImagePath }
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: err.message });
    }
});

const { verifyToken, verifyRole } = require("../middleware/authMiddleware");

router.get("/admin", verifyToken, verifyRole(["admin"]), (req, res) => {
    res.status(200).json({ message: "Chào mừng Admin!" });
});

router.get("/staff", verifyToken, verifyRole(["staff", "admin"]), (req, res) => {
    res.status(200).json({ message: "Chào mừng Staff!" });
});

router.get("/", verifyToken, (req, res) => {
    res.status(200).json({ message: "Chào mừng User!" });
});

module.exports = router;
