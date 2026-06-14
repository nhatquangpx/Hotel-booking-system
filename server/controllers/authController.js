const authService = require("../services/auth");
const { runService } = require("../lib/http/controllerHelper");

exports.register = (req, res) =>
  runService(res, () => authService.register(req.body));

exports.login = (req, res) =>
  runService(res, () =>
    authService.login({ ...req.body, req, res })
  );

exports.verify2FA = (req, res) =>
  runService(res, () =>
    authService.verify2FA({ ...req.body, req, res })
  );

exports.resend2FAOTP = (req, res) =>
  runService(res, () => authService.resend2FAOTP(req.body));

exports.refreshToken = (req, res) =>
  runService(res, () => authService.refreshToken({ req, res }));

exports.getMe = (req, res) =>
  runService(res, () => authService.getMe({ userId: req.user.id }));

exports.logout = (req, res) =>
  runService(res, () => authService.logout({ req, res }));

exports.forgotPassword = (req, res) =>
  runService(res, () => authService.forgotPassword(req.body));

exports.resetPassword = (req, res) =>
  runService(res, () =>
    authService.resetPassword({ userId: req.user.id, newPassword: req.body.newPassword })
  );
