const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const { sendNewPasswordEmail, send2FAOTPEmail } = require("../emails");
const {
  generateOTP,
  verifyOTP,
  requires2FA,
} = require("./twoFactorAuth");
const {
  isDeviceTrusted,
  getDeviceInfo,
  addTrustedDevice,
} = require("./deviceAuth");
const { autoRegenerateBackupCodesIfExhausted } = require("./twoFactorManagementService");
const { findHotelByStaffId } = require("../hotels/staffHotel");
const {
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenFromRequest,
  getTokenFromRequest,
} = require("../../lib/auth/authCookie");
const { setCsrfCookie } = require("../../lib/auth/csrf");
const {
  createAccessToken,
  createRefreshToken,
  persistRefreshToken,
  clearRefreshToken,
  findUserByRefreshToken,
} = require("./tokens");
const { ServiceError } = require("../../lib/http/serviceError");
const { reactivateIfExpired } = require("../moderation/accountStatus");

const formatAuthUser = (user, staffHotel = null) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  status: user.status,
  assignedHotelId: staffHotel
    ? { _id: staffHotel._id, name: staffHotel.name }
    : null,
});

const formatRegisterUser = (user) => ({
  id: user._id,
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  status: user.status,
});

async function resolveStaffHotel(user) {
  if (user.role !== "staff") return null;
  const staffHotel = await findHotelByStaffId(user._id);
  if (!staffHotel) {
    throw new ServiceError(
      403,
      "Tài khoản nhân viên chưa được gán khách sạn. Vui lòng liên hệ quản trị viên."
    );
  }
  return staffHotel;
}

async function issueAuthSession(res, user, staffHotel, extra = {}) {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken();
  await persistRefreshToken(user, refreshToken);
  setAuthCookies(res, accessToken, refreshToken);
  const csrfToken = setCsrfCookie(res);
  return {
    status: 200,
    body: {
      user: formatAuthUser(user, staffHotel),
      requires2FA: false,
      csrfToken,
      ...extra,
    },
  };
}

async function register({ name, email, password, phone }) {
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw new ServiceError(400, "Người dùng đã tồn tại!");
  }

  const salt = await bcrypt.genSalt();
  const hashPassword = await bcrypt.hash(password, salt);

  const newUser = new User({
    name,
    email,
    password: hashPassword,
    phone,
    role: "guest",
    status: "active",
  });

  await newUser.save();
  console.log(
    `Đăng ký thành công: User ${newUser._id} (${newUser.email}) với role ${newUser.role}`
  );

  return {
    status: 201,
    body: {
      message: "Đăng ký thành công!",
      user: formatRegisterUser(newUser),
    },
  };
}

async function login({ email, password, req, res }) {
  const user = await User.findOne({ email });
  if (!user) throw new ServiceError(400, "Người dùng không tồn tại!");

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new ServiceError(400, "Mật khẩu không chính xác!");

  await reactivateIfExpired(user);
  if (user.status === "inactive") {
    const until =
      user.inactiveUntil &&
      ` đến ${user.inactiveUntil.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}`;
    throw new ServiceError(
      403,
      `Tài khoản đã bị vô hiệu hóa${until || ""}${
        user.inactiveReason ? `: ${user.inactiveReason}` : ""
      }`
    );
  }

  const staffHotel = await resolveStaffHotel(user);

  if (requires2FA(user.role) && user.twoFactorAuth?.enabled) {
    const deviceInfo = getDeviceInfo(req);

    if (isDeviceTrusted(user, deviceInfo.deviceId)) {
      console.log(
        `Đăng nhập thành công với trusted device: User ${user._id} (${user.email})`
      );
      return issueAuthSession(res, user, staffHotel, { trustedDevice: true });
    }

    const otpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    user.temp2FAToken = otpCode;
    user.temp2FAExpires = expiresAt;
    await user.save();
    await send2FAOTPEmail(user.email, otpCode, user.name);

    console.log(`Yêu cầu 2FA cho user ${user._id} (${user.email})`);
    return {
      status: 200,
      body: {
        requires2FA: true,
        message: "Vui lòng nhập mã OTP đã được gửi đến email của bạn",
        userId: user._id,
        deviceId: deviceInfo.deviceId,
      },
    };
  }

  console.log(
    `Đăng nhập thành công: User ${user._id} (${user.email}) với role ${user.role}`
  );
  return issueAuthSession(res, user, staffHotel);
}

async function verify2FA({ userId, otpCode, rememberDevice, req, res }) {
  if (!userId || !otpCode) {
    throw new ServiceError(400, "Vui lòng cung cấp userId và mã OTP");
  }

  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");

  const staffHotel =
    user.role === "staff" ? await resolveStaffHotel(user) : null;

  if (!user.twoFactorAuth?.enabled) {
    throw new ServiceError(400, "Xác thực 2 lớp chưa được bật cho tài khoản này");
  }

  const isValid = verifyOTP(otpCode, user.temp2FAToken, user.temp2FAExpires);

  if (!isValid) {
    const backupCode = user.twoFactorAuth.backupCodes.find(
      (code) => code.code === otpCode.toUpperCase() && !code.used
    );

    if (backupCode) {
      backupCode.used = true;
      backupCode.usedAt = new Date();
      if (rememberDevice) {
        const deviceInfo = getDeviceInfo(req);
        addTrustedDevice(
          user,
          deviceInfo.deviceId,
          deviceInfo.deviceName,
          deviceInfo.userAgent,
          deviceInfo.ipAddress,
          30
        );
      }

      const backupCodesRegenerated = await autoRegenerateBackupCodesIfExhausted(user);

      console.log(
        `Đăng nhập thành công với backup code: User ${user._id} (${user.email})`
      );
      return issueAuthSession(res, user, staffHotel, {
        usedBackupCode: true,
        backupCodesRegenerated,
      });
    }

    throw new ServiceError(400, "Mã OTP không hợp lệ hoặc đã hết hạn");
  }

  user.temp2FAToken = null;
  user.temp2FAExpires = null;

  if (rememberDevice) {
    const deviceInfo = getDeviceInfo(req);
    addTrustedDevice(
      user,
      deviceInfo.deviceId,
      deviceInfo.deviceName,
      deviceInfo.userAgent,
      deviceInfo.ipAddress,
      30
    );
  }

  console.log(`Xác thực 2FA thành công: User ${user._id} (${user.email})`);
  return issueAuthSession(res, user, staffHotel);
}

async function resend2FAOTP({ userId }) {
  if (!userId) throw new ServiceError(400, "Vui lòng cung cấp userId");

  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");
  if (!user.twoFactorAuth?.enabled) {
    throw new ServiceError(400, "Xác thực 2 lớp chưa được bật");
  }

  const otpCode = generateOTP();
  user.temp2FAToken = otpCode;
  user.temp2FAExpires = new Date(Date.now() + 10 * 60 * 1000);
  await user.save();
  await send2FAOTPEmail(user.email, otpCode, user.name);

  console.log(`Đã gửi lại OTP cho user ${user._id} (${user.email})`);
  return { status: 200, body: { message: "Đã gửi lại mã OTP đến email của bạn" } };
}

async function refreshToken({ req, res }) {
  const refreshTokenValue = getRefreshTokenFromRequest(req);
  if (!refreshTokenValue) {
    clearAuthCookies(res);
    throw new ServiceError(401, "Không có refresh token");
  }

  const user = await findUserByRefreshToken(refreshTokenValue);
  if (!user) {
    clearAuthCookies(res);
    throw new ServiceError(401, "Refresh token không hợp lệ hoặc đã hết hạn");
  }

  if (user.status === "inactive") {
    await reactivateIfExpired(user);
  }
  if (user.status === "inactive") {
    await clearRefreshToken(user);
    clearAuthCookies(res);
    throw new ServiceError(403, "Tài khoản đã bị vô hiệu hóa");
  }

  let staffHotel = null;
  if (user.role === "staff") {
    staffHotel = await resolveStaffHotel(user);
    if (!staffHotel) {
      await clearRefreshToken(user);
      clearAuthCookies(res);
      throw new ServiceError(
        403,
        "Tài khoản nhân viên chưa được gán khách sạn. Vui lòng liên hệ quản trị viên."
      );
    }
  }

  const accessToken = createAccessToken(user);
  const newRefreshToken = createRefreshToken();
  await persistRefreshToken(user, newRefreshToken);
  setAuthCookies(res, accessToken, newRefreshToken);
  const csrfToken = setCsrfCookie(res);

  return {
    status: 200,
    body: {
      message: "Làm mới phiên đăng nhập thành công",
      csrfToken,
      user: formatAuthUser(user, staffHotel),
    },
  };
}

async function getMe({ userId }) {
  let user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");

  user = await reactivateIfExpired(user);

  let staffHotel = null;
  if (user.role === "staff") {
    staffHotel = await findHotelByStaffId(user._id);
  }

  return { status: 200, body: { user: formatAuthUser(user, staffHotel) } };
}

async function logout({ req, res }) {
  const refreshTokenValue = getRefreshTokenFromRequest(req);
  if (refreshTokenValue) {
    const user = await findUserByRefreshToken(refreshTokenValue);
    if (user) await clearRefreshToken(user);
  } else {
    const accessToken = getTokenFromRequest(req);
    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select(
          "+refreshTokenHash +refreshTokenExpires"
        );
        if (user) await clearRefreshToken(user);
      } catch {
        // access token hết hạn — bỏ qua
      }
    }
  }

  clearAuthCookies(res);
  return { status: 200, body: { message: "Đăng xuất thành công" } };
}

async function forgotPassword({ email }) {
  console.log("Received forgot password for:", email);
  const user = await User.findOne({ email });
  if (!user) {
    console.log("Email không tồn tại:", email);
    throw new ServiceError(404, "Email không tồn tại.");
  }

  const newPassword = crypto.randomBytes(10).toString("base64").slice(0, 12);
  const salt = await bcrypt.genSalt();
  user.password = await bcrypt.hash(newPassword, salt);
  user.refreshTokenHash = null;
  user.refreshTokenExpires = null;
  await user.save();

  await sendNewPasswordEmail(email, newPassword);
  console.log("Email sent to:", email);

  return { status: 200, body: { message: "Đã gửi mật khẩu mới." } };
}

async function resetPassword({ userId, newPassword }) {
  const user = await User.findById(userId);
  if (!user) throw new ServiceError(400, "Người dùng không tồn tại!");

  const salt = await bcrypt.genSalt();
  user.password = await bcrypt.hash(newPassword, salt);
  user.refreshTokenHash = null;
  user.refreshTokenExpires = null;
  await user.save();

  return {
    status: 200,
    body: { message: "Mật khẩu của bạn đã được đặt lại thành công!" },
  };
}

module.exports = {
  register,
  login,
  verify2FA,
  resend2FAOTP,
  refreshToken,
  getMe,
  logout,
  forgotPassword,
  resetPassword,
};
