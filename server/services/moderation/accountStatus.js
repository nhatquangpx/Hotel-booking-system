const User = require("../../models/User");
const { ServiceError } = require("../../lib/http/serviceError");

/**
 * Nếu inactive tạm thời đã hết hạn → tự mở lại active.
 * @returns {Promise<import("mongoose").Document|null>}
 */
async function reactivateIfExpired(user) {
  if (!user || user.status !== "inactive") return user;
  if (!user.inactiveUntil) return user;
  if (user.inactiveUntil.getTime() > Date.now()) return user;

  user.status = "active";
  user.inactiveUntil = null;
  user.inactiveReason = "";
  await user.save();
  return user;
}

/**
 * Ném lỗi nếu tài khoản đang bị vô hiệu hóa (sau khi thử auto-reactivate).
 */
async function assertAccountActive(userOrId) {
  let user = userOrId;
  if (!user || !user.status) {
    user = await User.findById(typeof userOrId === "object" ? userOrId._id || userOrId.id : userOrId);
  }
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");

  user = await reactivateIfExpired(user);

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

  return user;
}

/**
 * Vô hiệu hóa tài khoản (tạm hoặc không thời hạn).
 * @param {object} opts
 * @param {string} opts.userId
 * @param {number|null} [opts.days] - null/undefined = không thời hạn
 * @param {string} [opts.reason]
 */
async function deactivateAccount({ userId, days = null, reason = "" }) {
  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");
  if (user.role !== "guest") {
    throw new ServiceError(400, "Chỉ có thể vô hiệu hóa tài khoản khách (guest)");
  }

  const inactiveUntil =
    days != null && Number(days) > 0
      ? new Date(Date.now() + Number(days) * 24 * 60 * 60 * 1000)
      : null;

  user.status = "inactive";
  user.inactiveUntil = inactiveUntil;
  user.inactiveReason = String(reason || "").trim();
  user.refreshTokenHash = null;
  user.refreshTokenExpires = null;
  await user.save();
  return user;
}

/**
 * Mở lại tài khoản.
 */
async function reactivateAccount(userId) {
  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");
  user.status = "active";
  user.inactiveUntil = null;
  user.inactiveReason = "";
  await user.save();
  return user;
}

module.exports = {
  reactivateIfExpired,
  assertAccountActive,
  deactivateAccount,
  reactivateAccount,
};
