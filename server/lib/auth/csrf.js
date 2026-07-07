const crypto = require("crypto");
const { REFRESH_MS } = require("./refreshTokenConfig");

const CSRF_COOKIE_NAME = "csrf_token";
const CSRF_HEADER_NAME = "x-csrf-token";

const isProduction = process.env.NODE_ENV === "production";

const getCsrfCookieBaseOptions = () => ({
  httpOnly: false,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
});

const getCsrfCookieOptions = () => ({
  ...getCsrfCookieBaseOptions(),
  maxAge: REFRESH_MS,
});

function generateCsrfToken() {
  return crypto.randomBytes(32).toString("hex");
}

function setCsrfCookie(res, token = generateCsrfToken()) {
  res.cookie(CSRF_COOKIE_NAME, token, getCsrfCookieOptions());
  return token;
}

function clearCsrfCookie(res) {
  res.clearCookie(CSRF_COOKIE_NAME, getCsrfCookieBaseOptions());
}

function getCsrfTokenFromRequest(req) {
  const header = req.headers[CSRF_HEADER_NAME] || req.headers["X-CSRF-Token"];
  if (header) return String(header).trim();
  return null;
}

function getCsrfTokenFromCookie(req) {
  return req.cookies?.[CSRF_COOKIE_NAME] || null;
}

module.exports = {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  setCsrfCookie,
  clearCsrfCookie,
  getCsrfTokenFromRequest,
  getCsrfTokenFromCookie,
};
