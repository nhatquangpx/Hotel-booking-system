const User = require("../../models/User");
const {
  generateBackupCodes,
  requires2FA,
} = require("./twoFactorAuth");
const {
  removeTrustedDevice,
  removeAllTrustedDevices,
} = require("./deviceAuth");
const { send2FABackupCodesEmail } = require("../emails");
const { ServiceError } = require("../../lib/http/serviceError");

async function enable2FA({ userId }) {
  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");

  if (!requires2FA(user.role)) {
    throw new ServiceError(403, "Xác thực 2 lớp chỉ dành cho Admin và Chủ khách sạn");
  }
  if (user.twoFactorAuth?.enabled) {
    throw new ServiceError(400, "Xác thực 2 lớp đã được bật");
  }

  const backupCodes = generateBackupCodes(10);
  user.twoFactorAuth = { enabled: true, secret: null, backupCodes };
  await user.save();
  await send2FABackupCodesEmail(user.email, backupCodes, user.name);

  console.log(`Đã bật 2FA cho user ${user._id} (${user.email})`);
  return {
    status: 200,
    body: {
      message: "Đã bật xác thực 2 lớp thành công. Mã dự phòng đã được gửi đến email của bạn.",
      backupCodes: backupCodes.map((code) => code.code),
    },
  };
}

async function disable2FA({ userId }) {
  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");
  if (!user.twoFactorAuth?.enabled) {
    throw new ServiceError(400, "Xác thực 2 lớp chưa được bật");
  }

  user.twoFactorAuth = { enabled: false, secret: null, backupCodes: [] };
  user.temp2FAToken = null;
  user.temp2FAExpires = null;
  await user.save();

  console.log(`Đã tắt 2FA cho user ${user._id} (${user.email})`);
  return { status: 200, body: { message: "Đã tắt xác thực 2 lớp thành công" } };
}

async function get2FAStatus({ userId }) {
  const user = await User.findById(userId).select("twoFactorAuth role");
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");

  const isEnabled = user.twoFactorAuth?.enabled || false;
  const remainingBackupCodes =
    user.twoFactorAuth?.backupCodes?.filter((code) => !code.used).length || 0;

  return {
    status: 200,
    body: {
      enabled: isEnabled,
      requires2FA: requires2FA(user.role),
      remainingBackupCodes,
    },
  };
}

async function regenerateBackupCodes({ userId }) {
  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");
  if (!user.twoFactorAuth?.enabled) {
    throw new ServiceError(400, "Xác thực 2 lớp chưa được bật");
  }

  const backupCodes = generateBackupCodes(10);
  user.twoFactorAuth.backupCodes = backupCodes;
  await user.save();
  await send2FABackupCodesEmail(user.email, backupCodes, user.name);

  console.log(`Đã tạo lại backup codes cho user ${user._id} (${user.email})`);
  return {
    status: 200,
    body: {
      message: "Đã tạo lại mã dự phòng. Mã mới đã được gửi đến email của bạn.",
      backupCodes: backupCodes.map((code) => code.code),
    },
  };
}

async function getTrustedDevices({ userId }) {
  const user = await User.findById(userId).select("trustedDevices");
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");

  const activeDevices = user.trustedDevices.filter(
    (device) => new Date(device.expiresAt) > new Date()
  );

  return {
    status: 200,
    body: {
      devices: activeDevices.map((device) => ({
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        userAgent: device.userAgent,
        trustedAt: device.trustedAt,
        expiresAt: device.expiresAt,
      })),
    },
  };
}

async function removeTrustedDeviceById({ userId, deviceId }) {
  if (!deviceId) throw new ServiceError(400, "Vui lòng cung cấp deviceId");

  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");

  removeTrustedDevice(user, deviceId);
  await user.save();

  console.log(`Đã xóa trusted device ${deviceId} cho user ${user._id}`);
  return { status: 200, body: { message: "Đã xóa thiết bị tin cậy thành công" } };
}

async function removeAllTrustedDevicesForUser({ userId }) {
  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");

  removeAllTrustedDevices(user);
  await user.save();

  console.log(`Đã xóa tất cả trusted devices cho user ${user._id}`);
  return { status: 200, body: { message: "Đã xóa tất cả thiết bị tin cậy thành công" } };
}

module.exports = {
  enable2FA,
  disable2FA,
  get2FAStatus,
  regenerateBackupCodes,
  getTrustedDevices,
  removeTrustedDeviceById,
  removeAllTrustedDevicesForUser,
};
