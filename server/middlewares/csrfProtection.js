const {
  getCsrfTokenFromCookie,
  getCsrfTokenFromRequest,
} = require("../lib/auth/csrf");

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

/** Đường dẫn không yêu cầu CSRF (đăng nhập công khai, callback bên thứ ba). */
const EXEMPT_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/forgotpassword",
  "/api/auth/verify-2fa",
  "/api/auth/resend-2fa-otp",
  "/api/payment/vnpay-return",
  "/api/guest/contact",
];

function isExemptPath(path) {
  const normalized = path.split("?")[0];
  return EXEMPT_PATHS.some(
    (exempt) => normalized === exempt || normalized.startsWith(`${exempt}/`)
  );
}

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method)) {
    return next();
  }

  if (isExemptPath(req.path)) {
    return next();
  }

  const cookieToken = getCsrfTokenFromCookie(req);
  const headerToken = getCsrfTokenFromRequest(req);

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      message: "Thiếu hoặc sai token CSRF. Vui lòng tải lại trang và thử lại.",
      code: "CSRF_INVALID",
    });
  }

  return next();
}

module.exports = { csrfProtection, EXEMPT_PATHS };
