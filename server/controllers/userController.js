const userService = require("../services/users");
const { runService } = require("../lib/http/controllerHelper");
const { ServiceError } = require("../lib/http/serviceError");

function assertRole(req, role) {
  if (req.user?.role !== role) {
    throw new ServiceError(403, "Không có quyền truy cập");
  }
}

exports.getAllUsers = (req, res) => runService(res, () => userService.getAllUsers());

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
exports.updateGuestProfile = profileHandler("guest", "update");
exports.changeGuestPassword = profileHandler("guest", "password");

exports.getStaffProfile = profileHandler("staff", "get");
exports.updateStaffProfile = profileHandler("staff", "update");
exports.changeStaffPassword = profileHandler("staff", "password");

exports.getWishlist = (req, res) =>
  runService(res, () => userService.getWishlist({ userId: req.user.id }));

exports.toggleWishlist = (req, res) =>
  runService(res, () =>
    userService.toggleWishlist({ userId: req.user.id, hotelId: req.params.hotelId })
  );
