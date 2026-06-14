const { REFRESH_MS } = require("./refreshTokenConfig");

const ACCESS_COOKIE_NAME = "access_token";
const REFRESH_COOKIE_NAME = "refresh_token";
const REFRESH_COOKIE_PATH = "/api/auth";

const isProduction = process.env.NODE_ENV === "production";

const baseCookieOptions = () => ({
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
});

const getAccessCookieOptions = () => ({
  ...baseCookieOptions(),
  maxAge: parseMaxAgeMs(process.env.JWT_ACCESS_EXPIRES || "15m"),
  path: "/",
});

const getRefreshCookieOptions = () => ({
  ...baseCookieOptions(),
  maxAge: REFRESH_MS,
  path: REFRESH_COOKIE_PATH,
});

function parseMaxAgeMs(expiresIn) {
  const match = String(expiresIn).trim().match(/^(\d+)([smhd])?$/i);
  if (!match) return 15 * 60 * 1000;
  const n = Number(match[1]);
  const unit = (match[2] || "s").toLowerCase();
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return n * (multipliers[unit] || 1000);
}

const setAccessCookie = (res, token) => {
  res.cookie(ACCESS_COOKIE_NAME, token, getAccessCookieOptions());
};

const setRefreshCookie = (res, token) => {
  res.cookie(REFRESH_COOKIE_NAME, token, getRefreshCookieOptions());
};

const setAuthCookies = (res, accessToken, refreshToken) => {
  setAccessCookie(res, accessToken);
  setRefreshCookie(res, refreshToken);
};

const clearCookie = (res, name, path) => {
  res.clearCookie(name, { ...baseCookieOptions(), path });
};

const clearAuthCookies = (res) => {
  clearCookie(res, ACCESS_COOKIE_NAME, "/");
  clearCookie(res, REFRESH_COOKIE_NAME, REFRESH_COOKIE_PATH);
};

const setAuthCookie = (res, token) => setAccessCookie(res, token);
const clearAuthCookie = (res) => clearAuthCookies(res);

const getCookieValue = (req, name) => req.cookies?.[name] || null;

const getTokenFromRequest = (req) => {
  const fromCookie = getCookieValue(req, ACCESS_COOKIE_NAME);
  if (fromCookie) return fromCookie;
  const authHeader = req.header("Authorization");
  return authHeader ? authHeader.replace("Bearer ", "") : null;
};

const getRefreshTokenFromRequest = (req) => getCookieValue(req, REFRESH_COOKIE_NAME);

const parseCookieHeader = (cookieHeader, name) => {
  if (!cookieHeader) return null;
  const parts = cookieHeader.split(";").map((s) => s.trim());
  for (const part of parts) {
    if (part.startsWith(`${name}=`)) {
      return decodeURIComponent(part.slice(name.length + 1));
    }
  }
  return null;
};

const getTokenFromSocketHandshake = (socket) => {
  if (socket.handshake.auth?.token) return socket.handshake.auth.token;
  const authHeader = socket.handshake.headers.authorization;
  if (authHeader) return authHeader.replace("Bearer ", "");
  return parseCookieHeader(socket.handshake.headers.cookie, ACCESS_COOKIE_NAME);
};

module.exports = {
  ACCESS_COOKIE_NAME,
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_PATH,
  setAccessCookie,
  setRefreshCookie,
  setAuthCookies,
  clearAuthCookies,
  setAuthCookie,
  clearAuthCookie,
  getTokenFromRequest,
  getRefreshTokenFromRequest,
  getTokenFromSocketHandshake,
};
