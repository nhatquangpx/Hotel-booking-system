const jwt = require("jsonwebtoken");

// Hàm lấy token từ header
const getTokenFromHeader = (req) => {
    const token = req.header("Authorization");
    return token ? token.replace("Bearer ", "") : null;
};

// Middleware xác thực token
const verifyToken = (req, res, next) => {
    const token = getTokenFromHeader(req);
    if (!token) {
        return res.status(403).json({ message: "Truy cập bị từ chối! Không có token." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(401).json({ message: "Token không hợp lệ!" });
    }
};

// Middleware kiểm tra quyền truy cập theo vai trò
const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Bạn không có quyền truy cập!" });
        }
        next();
    };
};

module.exports = { verifyToken, verifyRole };
