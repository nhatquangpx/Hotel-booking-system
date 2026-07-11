const jwt = require("jsonwebtoken");
const { getTokenFromRequest } = require("../lib/auth/authCookie");
const User = require("../models/User");
const { assertAccountActive } = require("../services/moderation/accountStatus");
const { ServiceError } = require("../lib/http/serviceError");

const authenticate = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "Không có token truy cập." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;
    if (!userId) {
      return res.status(401).json({ message: "Token không hợp lệ!" });
    }

    const user = await User.findById(userId).select(
      "status inactiveUntil inactiveReason role"
    );
    if (!user) {
      return res.status(401).json({ message: "Người dùng không tồn tại!" });
    }

    try {
      await assertAccountActive(user);
    } catch (err) {
      if (err instanceof ServiceError && err.statusCode === 403) {
        return res.status(403).json({ message: err.message });
      }
      throw err;
    }

    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token không hợp lệ!" });
    }
    console.error("authenticate:", err);
    return res.status(500).json({ message: "Lỗi xác thực" });
  }
};

/** Gắn req.user nếu có token hợp lệ (cookie hoặc Bearer); không có hoặc lỗi thì bỏ qua. */
const optionalAuthenticate = async (req, res, next) => {
  const token = getTokenFromRequest(req);
  if (!token) {
    return next();
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const userId = decoded.id || decoded._id;
    if (!userId) {
      return next();
    }
    const user = await User.findById(userId).select(
      "status inactiveUntil inactiveReason"
    );
    if (!user) {
      return next();
    }
    try {
      await assertAccountActive(user);
      req.user = decoded;
    } catch {
      req.user = undefined;
    }
  } catch {
    req.user = undefined;
  }
  next();
};

module.exports = { authenticate, optionalAuthenticate };
