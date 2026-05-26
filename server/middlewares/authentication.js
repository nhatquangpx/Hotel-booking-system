const jwt = require("jsonwebtoken");
const { getTokenFromRequest } = require("../utils/authCookie");

const authenticate = (req, res, next) => {
    const token = getTokenFromRequest(req);
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

/** Gắn req.user nếu có token hợp lệ (cookie hoặc Bearer); không có hoặc lỗi thì bỏ qua. */
const optionalAuthenticate = (req, res, next) => {
    const token = getTokenFromRequest(req);
    if (!token) {
        return next();
    }
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
        req.user = undefined;
    }
    next();
};

module.exports = { authenticate, optionalAuthenticate };
