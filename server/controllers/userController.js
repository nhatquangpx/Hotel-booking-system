const userService = require("../services/users");
const { runService } = require("../lib/http/controllerHelper");
const { ServiceError } = require("../lib/http/serviceError");

function assertRole(req, role) {
  if (req.user?.role !== role) {
    throw new ServiceError(403, "Không có quyền truy cập");
  }
}

exports.getAllUsers = (req, res) =>
  runService(res, () =>
    userService.getAllUsers({
      page: req.query.page,
      limit: req.query.limit,
      all: req.query.all,
      view: req.query.view,
      searchName: req.query.searchName,
      searchEmail: req.query.searchEmail,
      searchPhone: req.query.searchPhone,
    })
  );

exports.getUserById = (req, res) =>
  runService(res, async () => ({
    status: 200,
    body: await userService.getProfileById(req.params.id || req.user?.id),
  }));

exports.createUser = (req, res) => runService(res, () => userService.createUser(req.body));

exports.updateUser = (req, res) =>
  runService(res, () =>
    userService.updateUser({ userId: req.params.id || req.user?.id, body: req.body })
  );

exports.deleteUser = (req, res) =>
  runService(res, () => userService.deleteUser({ userId: req.params.id }));

const profileHandler = (role, action) => (req, res) =>
  runService(res, async () => {
    assertRole(req, role);
    if (action === "get") return { status: 200, body: await userService.getProfileById(req.user.id) };
    if (action === "update") return { status: 200, body: await userService.updateSelfProfile(req.user.id, req.body) };
    return { status: 200, body: await userService.changeUserPassword(req.user.id, req.body) };
  });

exports.getOwnerProfile = profileHandler("owner", "get");
exports.updateOwnerProfile = profileHandler("owner", "update");
exports.changeOwnerPassword = profileHandler("owner", "password");

exports.getAdminProfile = profileHandler("admin", "get");
exports.updateAdminProfile = profileHandler("admin", "update");
exports.changeAdminPassword = profileHandler("admin", "password");

exports.getGuestProfile = profileHandler("guest", "get");
exports.updateGuestProfile = (req, res) =>
  runService(res, async () => {
    assertRole(req, "guest");
    const { buildSensitiveMediaRef } = require("../services/media/sensitiveMedia");
    const body = { ...req.body };
    const frontFile = req.files?.idImageFront?.[0];
    const backFile = req.files?.idImageBack?.[0];
    if (frontFile) {
      body.idImageFrontUrl = buildSensitiveMediaRef(frontFile, "id-cards");
    }
    if (backFile) {
      body.idImageBackUrl = buildSensitiveMediaRef(backFile, "id-cards");
    }
    return {
      status: 200,
      body: await userService.updateSelfProfile(req.user.id, body, {
        includeGuestIdFields: true,
      }),
    };
  });
exports.changeGuestPassword = profileHandler("guest", "password");

/** Guest xem ảnh CCCD trên hồ sơ (private) — side: front | back */
exports.streamGuestProfileIdImage = async (req, res) => {
  try {
    assertRole(req, "guest");
    const side = String(req.params.side || "").toLowerCase();
    if (side !== "front" && side !== "back") {
      return res.status(400).json({ message: "side phải là front hoặc back" });
    }
    const User = require("../models/User");
    const { hasSensitiveMedia, streamSensitiveMedia } = require("../services/media/sensitiveMedia");
    const field = side === "back" ? "idImageBackUrl" : "idImageFrontUrl";
    const user = await User.findById(req.user.id).select("idImageFrontUrl idImageBackUrl");
    if (!user || !hasSensitiveMedia(user[field])) {
      return res.status(404).json({ message: `Chưa có ảnh CCCD mặt ${side === "back" ? "sau" : "trước"}` });
    }
    await streamSensitiveMedia(res, user[field]);
  } catch (err) {
    const status = err.statusCode || err.status || 500;
    if (!res.headersSent) {
      res.status(status).json({ message: err.message || "Không thể tải ảnh" });
    }
  }
};

exports.getStaffProfile = profileHandler("staff", "get");
exports.updateStaffProfile = profileHandler("staff", "update");
exports.changeStaffPassword = profileHandler("staff", "password");

exports.getWishlist = (req, res) =>
  runService(res, () => userService.getWishlist({ userId: req.user.id }));

exports.toggleWishlist = (req, res) =>
  runService(res, () =>
    userService.toggleWishlist({ userId: req.user.id, hotelId: req.params.hotelId })
  );
