const mongoose = require("mongoose");
const Booking = require("../../models/Booking");
const CancelAbuseFlag = require("../../models/CancelAbuseFlag");
const User = require("../../models/User");
const { ServiceError } = require("../../lib/http/serviceError");
const { THRESHOLD, WINDOW_DAYS, DEFAULT_SANCTION_DAYS } = require("./cancelAbuseConfig");
const { deactivateAccount } = require("./accountStatus");
const { notifyAdminCancelAbuse } = require("../notifications/admin");

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

/**
 * Sau khi guest hủy đơn: đếm hủy trong cửa sổ, tạo/cập nhật cờ pending + thông báo admin.
 */
async function evaluateAfterGuestCancel(guestId, bookingId) {
  try {
    if (!guestId || !bookingId) return null;

    const windowEnd = new Date();
    const windowStart = new Date(windowEnd.getTime() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

    const cancelled = await Booking.find({
      guest: guestId,
      paymentStatus: "cancelled",
      guestCancelRequestedAt: { $gte: windowStart, $lte: windowEnd },
    })
      .select("_id guestCancelRequestedAt")
      .sort({ guestCancelRequestedAt: 1 })
      .lean();

    if (cancelled.length < THRESHOLD) return null;

    const bookingIds = cancelled.map((b) => b._id);
    const guest = await User.findById(guestId).select("name email phone status role");
    if (!guest || guest.role !== "guest") return null;
    if (guest.status === "inactive") return null;

    let flag = await CancelAbuseFlag.findOne({ guest: guestId, status: "pending" });
    const isNew = !flag;

    if (flag) {
      flag.cancelCount = cancelled.length;
      flag.windowStart = windowStart;
      flag.windowEnd = windowEnd;
      flag.bookingIds = bookingIds;
      await flag.save();
    } else {
      flag = await CancelAbuseFlag.create({
        guest: guestId,
        cancelCount: cancelled.length,
        windowStart,
        windowEnd,
        bookingIds,
        status: "pending",
      });
    }

    if (isNew) {
      notifyAdminCancelAbuse(flag._id).catch((err) =>
        console.error("Lỗi thông báo admin cancel abuse:", err)
      );
    }

    return flag;
  } catch (err) {
    console.error("evaluateAfterGuestCancel:", err);
    return null;
  }
}

async function listFlags({ page = 1, limit = 20, status = "pending" } = {}) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const l = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
  const query = {};
  if (status && status !== "all") {
    if (!["pending", "dismissed", "sanctioned"].includes(status)) {
      throw new ServiceError(400, "Trạng thái lọc không hợp lệ");
    }
    query.status = status;
  }

  const [items, total] = await Promise.all([
    CancelAbuseFlag.find(query)
      .populate("guest", "name email phone status inactiveUntil inactiveReason")
      .populate("reviewedBy", "name email")
      .sort({ createdAt: -1 })
      .skip((p - 1) * l)
      .limit(l)
      .lean(),
    CancelAbuseFlag.countDocuments(query),
  ]);

  const pendingCount = await CancelAbuseFlag.countDocuments({ status: "pending" });

  return {
    status: 200,
    body: {
      flags: items,
      pendingCount,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.max(1, Math.ceil(total / l)),
      },
      config: {
        threshold: THRESHOLD,
        windowDays: WINDOW_DAYS,
        defaultSanctionDays: DEFAULT_SANCTION_DAYS,
      },
    },
  };
}

async function getFlagById(flagId) {
  if (!isValidObjectId(flagId)) throw new ServiceError(400, "ID không hợp lệ");
  const flag = await CancelAbuseFlag.findById(flagId)
    .populate("guest", "name email phone status inactiveUntil inactiveReason role")
    .populate("reviewedBy", "name email")
    .populate({
      path: "bookingIds",
      select:
        "checkInDate checkOutDate paymentStatus finalAmount totalPrice hotel room guestCancelRequestedAt cancellationReason",
      populate: [
        { path: "hotel", select: "name" },
        { path: "room", select: "roomNumber type" },
      ],
    })
    .lean();
  if (!flag) throw new ServiceError(404, "Không tìm thấy mục danh sách đen");
  return { status: 200, body: flag };
}

/**
 * Admin xử lý cờ: dismiss | sanction (inactive tạm / vĩnh viễn).
 */
async function reviewFlag({ flagId, adminId, action, sanctionDays, adminNote }) {
  if (!isValidObjectId(flagId)) throw new ServiceError(400, "ID không hợp lệ");

  const flag = await CancelAbuseFlag.findById(flagId);
  if (!flag) throw new ServiceError(404, "Không tìm thấy mục danh sách đen");
  if (flag.status !== "pending") {
    throw new ServiceError(400, "Mục danh sách đen đã được xử lý");
  }

  const note = String(adminNote || "").trim();

  if (action === "dismiss") {
    flag.status = "dismissed";
    flag.reviewedBy = adminId;
    flag.reviewedAt = new Date();
    flag.adminNote = note || "Bỏ qua — không xử lý";
    await flag.save();
    const populated = await CancelAbuseFlag.findById(flag._id)
      .populate("guest", "name email phone status inactiveUntil inactiveReason")
      .populate("reviewedBy", "name email")
      .lean();
    return {
      status: 200,
      body: { message: "Đã bỏ qua mục danh sách đen", flag: populated },
    };
  }

  if (action === "sanction") {
    let days = sanctionDays;
    if (days === "" || days === undefined) days = DEFAULT_SANCTION_DAYS;
    if (days === null || days === "permanent" || days === 0) {
      days = null;
    } else {
      days = Number(days);
      if (!Number.isFinite(days) || days < 1) {
        throw new ServiceError(400, "Số ngày cấm không hợp lệ");
      }
    }

    const reason =
      note ||
      `Hủy đơn liên tục (${flag.cancelCount} lần / ${WINDOW_DAYS} ngày) — admin xem xét`;

    const user = await deactivateAccount({
      userId: flag.guest,
      days,
      reason,
    });

    flag.status = "sanctioned";
    flag.reviewedBy = adminId;
    flag.reviewedAt = new Date();
    flag.adminNote = reason;
    flag.sanctionDays = days;
    flag.sanctionUntil = user.inactiveUntil;
    await flag.save();

    const populated = await CancelAbuseFlag.findById(flag._id)
      .populate("guest", "name email phone status inactiveUntil inactiveReason")
      .populate("reviewedBy", "name email")
      .lean();

    return {
      status: 200,
      body: {
        message: days
          ? `Đã vô hiệu hóa tài khoản ${days} ngày`
          : "Đã vô hiệu hóa tài khoản (không thời hạn)",
        flag: populated,
      },
    };
  }

  throw new ServiceError(400, "action phải là dismiss hoặc sanction");
}

module.exports = {
  evaluateAfterGuestCancel,
  listFlags,
  getFlagById,
  reviewFlag,
};
