const User = require("../models/User");
const { generateBackupCodes, requires2FA, removeTrustedDevice, removeAllTrustedDevices } = require("../services/auth");
const { send2FABackupCodesEmail } = require("../services/emails");

/**
 * Enable 2FA for user
 * Only available for admin and owner roles
 */
exports.enable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    // Kiểm tra role có yêu cầu 2FA không
    if (!requires2FA(user.role)) {
      return res.status(403).json({ 
        message: "Xác thực 2 lớp chỉ dành cho Admin và Chủ khách sạn" 
      });
    }

    // Kiểm tra đã bật 2FA chưa
    if (user.twoFactorAuth?.enabled) {
      return res.status(400).json({ message: "Xác thực 2 lớp đã được bật" });
    }

    // Generate backup codes
    const backupCodes = generateBackupCodes(10);

    // Enable 2FA
    user.twoFactorAuth = {
      enabled: true,
      secret: null, // Có thể dùng TOTP secret nếu muốn dùng authenticator app
      backupCodes: backupCodes
    };

    await user.save();

    // Gửi backup codes qua email
    await send2FABackupCodesEmail(user.email, backupCodes, user.name);

    console.log(`Đã bật 2FA cho user ${user._id} (${user.email})`);

    res.status(200).json({
      message: "Đã bật xác thực 2 lớp thành công. Mã dự phòng đã được gửi đến email của bạn.",
      backupCodes: backupCodes.map(code => code.code) // Trả về để hiển thị (nên lưu lại)
    });
  } catch (err) {
    console.error("Enable 2FA error:", err);
    res.status(500).json({ message: "Lỗi khi bật xác thực 2 lớp", error: err.message });
  }
};

/**
 * Disable 2FA for user
 */
exports.disable2FA = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    // Kiểm tra đã bật 2FA chưa
    if (!user.twoFactorAuth?.enabled) {
      return res.status(400).json({ message: "Xác thực 2 lớp chưa được bật" });
    }

    // Disable 2FA
    user.twoFactorAuth = {
      enabled: false,
      secret: null,
      backupCodes: []
    };
    user.temp2FAToken = null;
    user.temp2FAExpires = null;

    await user.save();

    console.log(`Đã tắt 2FA cho user ${user._id} (${user.email})`);

    res.status(200).json({ message: "Đã tắt xác thực 2 lớp thành công" });
  } catch (err) {
    console.error("Disable 2FA error:", err);
    res.status(500).json({ message: "Lỗi khi tắt xác thực 2 lớp", error: err.message });
  }
};

/**
 * Get 2FA status
 */
exports.get2FAStatus = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('twoFactorAuth role');

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    const isEnabled = user.twoFactorAuth?.enabled || false;
    const remainingBackupCodes = user.twoFactorAuth?.backupCodes?.filter(code => !code.used).length || 0;
    const requires2FAForRole = requires2FA(user.role);

    res.status(200).json({
      enabled: isEnabled,
      requires2FA: requires2FAForRole,
      remainingBackupCodes: remainingBackupCodes
    });
  } catch (err) {
    console.error("Get 2FA status error:", err);
    res.status(500).json({ message: "Lỗi khi lấy trạng thái 2FA", error: err.message });
  }
};

/**
 * Regenerate backup codes
 */
exports.regenerateBackupCodes = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    if (!user.twoFactorAuth?.enabled) {
      return res.status(400).json({ message: "Xác thực 2 lớp chưa được bật" });
    }

    // Generate backup codes mới
    const backupCodes = generateBackupCodes(10);

    // Cập nhật backup codes
    user.twoFactorAuth.backupCodes = backupCodes;
    await user.save();

    // Gửi backup codes qua email
    await send2FABackupCodesEmail(user.email, backupCodes, user.name);

    console.log(`Đã tạo lại backup codes cho user ${user._id} (${user.email})`);

    res.status(200).json({
      message: "Đã tạo lại mã dự phòng. Mã mới đã được gửi đến email của bạn.",
      backupCodes: backupCodes.map(code => code.code) // Trả về để hiển thị (nên lưu lại)
    });
  } catch (err) {
    console.error("Regenerate backup codes error:", err);
    res.status(500).json({ message: "Lỗi khi tạo lại mã dự phòng", error: err.message });
  }
};

/**
 * Get trusted devices list
 */
exports.getTrustedDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).select('trustedDevices');

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    // Filter out expired devices
    const activeDevices = user.trustedDevices.filter(
      device => new Date(device.expiresAt) > new Date()
    );

    res.status(200).json({
      devices: activeDevices.map(device => ({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        userAgent: device.userAgent,
        trustedAt: device.trustedAt,
        expiresAt: device.expiresAt
      }))
    });
  } catch (err) {
    console.error("Get trusted devices error:", err);
    res.status(500).json({ message: "Lỗi khi lấy danh sách thiết bị", error: err.message });
  }
};

/**
 * Remove a trusted device
 */
exports.removeTrustedDevice = async (req, res) => {
  try {
    const userId = req.user.id;
    const { deviceId } = req.body;

    if (!deviceId) {
      return res.status(400).json({ message: "Vui lòng cung cấp deviceId" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    removeTrustedDevice(user, deviceId);
    await user.save();

    console.log(`Đã xóa trusted device ${deviceId} cho user ${user._id}`);

    res.status(200).json({ message: "Đã xóa thiết bị tin cậy thành công" });
  } catch (err) {
    console.error("Remove trusted device error:", err);
    res.status(500).json({ message: "Lỗi khi xóa thiết bị tin cậy", error: err.message });
  }
};

/**
 * Remove all trusted devices
 */
exports.removeAllTrustedDevices = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Người dùng không tồn tại!" });
    }

    removeAllTrustedDevices(user);
    await user.save();

    console.log(`Đã xóa tất cả trusted devices cho user ${user._id}`);

    res.status(200).json({ message: "Đã xóa tất cả thiết bị tin cậy thành công" });
  } catch (err) {
    console.error("Remove all trusted devices error:", err);
    res.status(500).json({ message: "Lỗi khi xóa tất cả thiết bị tin cậy", error: err.message });
  }
};
