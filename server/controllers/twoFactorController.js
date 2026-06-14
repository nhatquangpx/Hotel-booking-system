const authService = require("../services/auth");
const { runService } = require("../lib/http/controllerHelper");

exports.enable2FA = (req, res) =>
  runService(res, () => authService.enable2FA({ userId: req.user.id }));

exports.disable2FA = (req, res) =>
  runService(res, () => authService.disable2FA({ userId: req.user.id }));

exports.get2FAStatus = (req, res) =>
  runService(res, () => authService.get2FAStatus({ userId: req.user.id }));

exports.regenerateBackupCodes = (req, res) =>
  runService(res, () => authService.regenerateBackupCodes({ userId: req.user.id }));

exports.getTrustedDevices = (req, res) =>
  runService(res, () => authService.getTrustedDevices({ userId: req.user.id }));

exports.removeTrustedDevice = (req, res) =>
  runService(res, () =>
    authService.removeTrustedDeviceById({ userId: req.user.id, deviceId: req.body.deviceId })
  );

exports.removeAllTrustedDevices = (req, res) =>
  runService(res, () => authService.removeAllTrustedDevicesForUser({ userId: req.user.id }));
