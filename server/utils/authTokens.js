const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { REFRESH_MS } = require("./refreshTokenConfig");
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || "15m";

const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const createAccessToken = (user) =>
  jwt.sign(
    { id: user._id, role: user.role, type: "access" },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_EXPIRES }
  );

const createRefreshToken = () => crypto.randomBytes(48).toString("hex");

const persistRefreshToken = async (user, refreshToken) => {
  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpires = new Date(Date.now() + REFRESH_MS);
  await user.save();
};

const clearRefreshToken = async (user) => {
  user.refreshTokenHash = null;
  user.refreshTokenExpires = null;
  await user.save();
};

const findUserByRefreshToken = async (refreshToken) => {
  if (!refreshToken) return null;
  const hash = hashRefreshToken(refreshToken);
  return User.findOne({
    refreshTokenHash: hash,
    refreshTokenExpires: { $gt: new Date() },
  }).select("+refreshTokenHash +refreshTokenExpires");
};

module.exports = {
  ACCESS_EXPIRES,
  REFRESH_MS,
  hashRefreshToken,
  createAccessToken,
  createRefreshToken,
  persistRefreshToken,
  clearRefreshToken,
  findUserByRefreshToken,
};
