const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const crypto = require("crypto");
const { sendNewPasswordEmail, send2FAOTPEmail } = require("../services/emails");
const { generateOTP, verifyOTP, requires2FA, isDeviceTrusted, getDeviceInfo, addTrustedDevice } = require("../services/auth");

const { findHotelByStaffId } = require("../utils/staffHotel");
const {
  setAuthCookies,
  clearAuthCookies,
  getRefreshTokenFromRequest,
  getTokenFromRequest,
} = require("../utils/authCookie");
const {
  createAccessToken,
  createRefreshToken,
  persistRefreshToken,
  clearRefreshToken,
  findUserByRefreshToken,
} = require("../utils/authTokens");

const issueAuthSession = async (res, user, staffHotel, extra = {}) => {
  const accessToken = createAccessToken(user);
  const refreshToken = createRefreshToken();
  await persistRefreshToken(user, refreshToken);
  setAuthCookies(res, accessToken, refreshToken);
  return res.status(200).json({
    user: formatAuthUser(user, staffHotel),
    requires2FA: false,
    ...extra,
  });
};

/**
 * Cùng shape với enrichUserWithStaffHotel / admin API: assignedHotelId = { _id, name } | null
 */
const formatAuthUser = (user, staffHotel = null) => ({
    id: user._id,
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    assignedHotelId: staffHotel
        ? { _id: staffHotel._id, name: staffHotel.name }
        : null,
});

// Đăng ký công khai — luôn tạo tài khoản guest; không nhận role/status từ client
exports.register = async (req, res) => {
    try {
        const { name, email, password, phone } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: "Người dùng đã tồn tại!" });

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
        console.log(`Đăng ký thành công: User ${newUser._id} (${newUser.email}) với role ${newUser.role}`);
        res.status(201).json({ message: "Đăng ký thành công!", user: newUser });
    } catch (err) {
      console.error("Registration Error:", err); 
      res.status(500).json({ message: "Đăng ký thất bại!", error: err.message });
  }
}

// Đăng nhập
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if (!user) return res.status(400).json({ message: "Người dùng không tồn tại!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu không chính xác!" });

        let staffHotel = null;
        if (user.role === "staff") {
            staffHotel = await findHotelByStaffId(user._id);
            if (!staffHotel) {
                return res.status(403).json({
                    message:
                        "Tài khoản nhân viên chưa được gán khách sạn. Vui lòng liên hệ quản trị viên.",
                });
            }
        }

        // Kiểm tra nếu role yêu cầu 2FA và user đã bật 2FA
        if (requires2FA(user.role) && user.twoFactorAuth?.enabled) {
            // Lấy thông tin device
            const deviceInfo = getDeviceInfo(req);
            
            // Kiểm tra xem device có được trust không
            if (isDeviceTrusted(user, deviceInfo.deviceId)) {
                console.log(`Đăng nhập thành công với trusted device: User ${user._id} (${user.email})`);
                return await issueAuthSession(res, user, staffHotel, { trustedDevice: true });
            }

            // Device chưa được trust, yêu cầu 2FA
            // Generate OTP và lưu vào temp token
            const otpCode = generateOTP();
            const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

            // Lưu OTP vào database
            user.temp2FAToken = otpCode;
            user.temp2FAExpires = expiresAt;
            await user.save();

            // Gửi OTP qua email
            await send2FAOTPEmail(user.email, otpCode, user.name);

            console.log(`Yêu cầu 2FA cho user ${user._id} (${user.email})`);
            return res.status(200).json({
                requires2FA: true,
                message: "Vui lòng nhập mã OTP đã được gửi đến email của bạn",
                userId: user._id,
                deviceId: deviceInfo.deviceId
            });
        }

        // Nếu không cần 2FA, tạo phiên đăng nhập
        console.log(`Đăng nhập thành công: User ${user._id} (${user.email}) với role ${user.role}`);
        await issueAuthSession(res, user, staffHotel);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Xác thực 2FA
exports.verify2FA = async (req, res) => {
    try {
        const { userId, otpCode, rememberDevice } = req.body;

        if (!userId || !otpCode) {
            return res.status(400).json({ message: "Vui lòng cung cấp userId và mã OTP" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại!" });
        }

        const staffHotel =
            user.role === "staff" ? await findHotelByStaffId(user._id) : null;

        if (user.role === "staff" && !staffHotel) {
            return res.status(403).json({
                message:
                    "Tài khoản nhân viên chưa được gán khách sạn. Vui lòng liên hệ quản trị viên.",
            });
        }

        // Kiểm tra 2FA có được bật không
        if (!user.twoFactorAuth?.enabled) {
            return res.status(400).json({ message: "Xác thực 2 lớp chưa được bật cho tài khoản này" });
        }

        // Kiểm tra OTP
        const isValid = verifyOTP(otpCode, user.temp2FAToken, user.temp2FAExpires);

        if (!isValid) {
            // Kiểm tra backup codes nếu OTP không hợp lệ
            const backupCode = user.twoFactorAuth.backupCodes.find(
                code => code.code === otpCode.toUpperCase() && !code.used
            );

            if (backupCode) {
                // Sử dụng backup code
                backupCode.used = true;
                backupCode.usedAt = new Date();
                
                // Lưu trusted device nếu user chọn remember
                if (rememberDevice) {
                    const deviceInfo = getDeviceInfo(req);
                    addTrustedDevice(user, deviceInfo.deviceId, deviceInfo.deviceName, deviceInfo.userAgent, deviceInfo.ipAddress, 30);
                }
                
                console.log(`Đăng nhập thành công với backup code: User ${user._id} (${user.email})`);
                return await issueAuthSession(res, user, staffHotel, { usedBackupCode: true });
            }

            return res.status(400).json({ message: "Mã OTP không hợp lệ hoặc đã hết hạn" });
        }

        // Xóa temp token sau khi verify thành công
        user.temp2FAToken = null;
        user.temp2FAExpires = null;
        
        // Lưu trusted device nếu user chọn remember
        if (rememberDevice) {
            const deviceInfo = getDeviceInfo(req);
            addTrustedDevice(user, deviceInfo.deviceId, deviceInfo.deviceName, deviceInfo.userAgent, deviceInfo.ipAddress, 30);
        }
        
        console.log(`Xác thực 2FA thành công: User ${user._id} (${user.email})`);
        await issueAuthSession(res, user, staffHotel);
    } catch (err) {
        console.error("2FA verification error:", err);
        res.status(500).json({ message: "Lỗi khi xác thực 2FA", error: err.message });
    }
};

// Gửi lại OTP
exports.resend2FAOTP = async (req, res) => {
    try {
        const { userId } = req.body;

        if (!userId) {
            return res.status(400).json({ message: "Vui lòng cung cấp userId" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại!" });
        }

        if (!user.twoFactorAuth?.enabled) {
            return res.status(400).json({ message: "Xác thực 2 lớp chưa được bật" });
        }

        // Generate OTP mới
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 phút

        user.temp2FAToken = otpCode;
        user.temp2FAExpires = expiresAt;
        await user.save();

        // Gửi OTP qua email
        await send2FAOTPEmail(user.email, otpCode, user.name);

        console.log(`Đã gửi lại OTP cho user ${user._id} (${user.email})`);
        res.status(200).json({ message: "Đã gửi lại mã OTP đến email của bạn" });
    } catch (err) {
        console.error("Resend 2FA OTP error:", err);
        res.status(500).json({ message: "Lỗi khi gửi lại mã OTP", error: err.message });
    }
};

exports.refreshToken = async (req, res) => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req);
        if (!refreshToken) {
            clearAuthCookies(res);
            return res.status(401).json({ message: "Không có refresh token" });
        }

        const user = await findUserByRefreshToken(refreshToken);
        if (!user) {
            clearAuthCookies(res);
            return res.status(401).json({ message: "Refresh token không hợp lệ hoặc đã hết hạn" });
        }

        if (user.status === "inactive") {
            await clearRefreshToken(user);
            clearAuthCookies(res);
            return res.status(403).json({ message: "Tài khoản đã bị vô hiệu hóa" });
        }

        let staffHotel = null;
        if (user.role === "staff") {
            staffHotel = await findHotelByStaffId(user._id);
            if (!staffHotel) {
                await clearRefreshToken(user);
                clearAuthCookies(res);
                return res.status(403).json({
                    message:
                        "Tài khoản nhân viên chưa được gán khách sạn. Vui lòng liên hệ quản trị viên.",
                });
            }
        }

        const accessToken = createAccessToken(user);
        const newRefreshToken = createRefreshToken();
        await persistRefreshToken(user, newRefreshToken);
        setAuthCookies(res, accessToken, newRefreshToken);

        res.status(200).json({
            message: "Làm mới phiên đăng nhập thành công",
            user: formatAuthUser(user, staffHotel),
        });
    } catch (err) {
        console.error("Refresh token error:", err);
        clearAuthCookies(res);
        res.status(500).json({ message: "Lỗi khi làm mới phiên đăng nhập", error: err.message });
    }
};

exports.getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) {
            return res.status(404).json({ message: "Người dùng không tồn tại!" });
        }

        let staffHotel = null;
        if (user.role === "staff") {
            staffHotel = await findHotelByStaffId(user._id);
        }

        res.status(200).json({ user: formatAuthUser(user, staffHotel) });
    } catch (err) {
        res.status(500).json({ message: "Không thể tải thông tin phiên đăng nhập", error: err.message });
    }
};

exports.logout = async (req, res) => {
    try {
        const refreshToken = getRefreshTokenFromRequest(req);
        if (refreshToken) {
            const user = await findUserByRefreshToken(refreshToken);
            if (user) {
                await clearRefreshToken(user);
            }
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
        res.status(200).json({ message: "Đăng xuất thành công" });
    } catch (err) {
        clearAuthCookies(res);
        res.status(500).json({ message: "Lỗi khi đăng xuất", error: err.message });
    }
};

//Quên mật khẩu
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    console.log("Received forgot password for:", email);

    const user = await User.findOne({ email });
    if (!user) {
      console.log("Email không tồn tại:", email);
      return res.status(404).json({ message: 'Email không tồn tại.' });
    }

    const newPassword = crypto.randomBytes(10).toString('base64').slice(0, 12);
    const salt = await bcrypt.genSalt();
    const hashNewPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashNewPassword;
    user.refreshTokenHash = null;
    user.refreshTokenExpires = null;
    await user.save();

    await sendNewPasswordEmail(email, newPassword);
    console.log("Email sent to:", email);

    res.status(200).json({ message: 'Đã gửi mật khẩu mới.' });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: 'Lỗi khi xử lý yêu cầu đặt lại mật khẩu.' });
  }
};

//Đổi mật khẩu
exports.resetPassword = async (req, res) => {
    try {
      const { newPassword } = req.body;
      const id = req.user.id;
  
      const user = await User.findById(id);
      if (!user) return res.status(400).json({ message: "Người dùng không tồn tại!" });
  
      const salt = await bcrypt.genSalt();
      const hashNewPassword = await bcrypt.hash(newPassword, salt);
      user.password = hashNewPassword;
      user.refreshTokenHash = null;
      user.refreshTokenExpires = null;
      await user.save();
      res.status(200).json({ message: "Mật khẩu của bạn đã được đặt lại thành công!" });
    } catch (err) {
      res.status(500).json({ message: "Đã xảy ra lỗi khi đặt lại mật khẩu.", error: err.message });
    }
};
