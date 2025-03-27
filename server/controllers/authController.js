const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Đăng ký
exports.register = async (req, res) => {
    try {
        const { firstName, lastName, email, password, role } = req.body;
        const profileImagePath = req.file ? `/uploads/${req.file.filename}` : "";

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Người dùng đã tồn tại!" });

        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(password, salt);

        const newUser = new User({
            firstName, lastName, email, password: hashPassword, role: role || "user", profileImagePath
        });

        await newUser.save();
        res.status(201).json({ message: "Đăng ký thành công!", user: newUser });
    } catch (err) {
        res.status(500).json({ message: "Đăng ký thất bại!", error: err.message });
    }
};

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "Người dùng không tồn tại!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu không chính xác!" });

        const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(200).json({
            token,
            user: { id: user._id, email: user.email, role: user.role, profileImagePath: user.profileImagePath }
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Kiểm tra quyền truy cập
exports.adminAccess = (req, res) => res.status(200).json({ message: "Chào mừng Admin!" });
exports.staffAccess = (req, res) => res.status(200).json({ message: "Chào mừng Staff!" });
exports.userAccess = (req, res) => res.status(200).json({ message: "Chào mừng User!" });
