const SELF_PROFILE_FIELDS = ["name", "phone"];
const GUEST_PROFILE_FIELDS = [
  "name",
  "phone",
  "idNumber",
  "idImageFrontUrl",
  "idImageBackUrl",
];

const PROFILE_DB_SELECT =
  "name email phone role status createdAt updatedAt twoFactorAuth.enabled idNumber idImageFrontUrl idImageBackUrl";

const ID_NUMBER_PATTERN = /^\d{9}$|^\d{12}$/;

function normalizeIdNumber(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function isCompleteGuestId(userLike) {
  const idNumber = normalizeIdNumber(userLike?.idNumber);
  return (
    ID_NUMBER_PATTERN.test(idNumber) &&
    Boolean(userLike?.idImageFrontUrl) &&
    Boolean(userLike?.idImageBackUrl)
  );
}

function toPublicProfile(user) {
  const plain = user?.toObject ? user.toObject() : { ...user };
  const out = {
    _id: plain._id,
    name: plain.name,
    email: plain.email,
    phone: plain.phone,
    role: plain.role,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };

  if (plain.id) out.id = plain.id;
  if (plain.assignedHotelId !== undefined) out.assignedHotelId = plain.assignedHotelId;
  if (plain.twoFactorAuth && typeof plain.twoFactorAuth.enabled === "boolean") {
    out.twoFactorAuth = { enabled: plain.twoFactorAuth.enabled };
  }

  if (plain.role === "guest") {
    out.idNumber = plain.idNumber || "";
    out.idImageFrontUrl = plain.idImageFrontUrl || null;
    out.idImageBackUrl = plain.idImageBackUrl || null;
    out.hasIdImageFront = Boolean(plain.idImageFrontUrl);
    out.hasIdImageBack = Boolean(plain.idImageBackUrl);
    out.hasCompleteId = isCompleteGuestId(plain);
  }

  return out;
}

function toUserIdString(id) {
  return id?.toString?.() || String(id);
}

function profileIdsMatch(paramId, authId) {
  if (!paramId || !authId) return false;
  return toUserIdString(paramId) === toUserIdString(authId);
}

function pickSelfProfileFields(body, { includeGuestIdFields = false } = {}) {
  const allowed = includeGuestIdFields ? GUEST_PROFILE_FIELDS : SELF_PROFILE_FIELDS;
  const payload = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, key)) payload[key] = body[key];
  }
  return payload;
}

function buildValidatedSelfProfilePayload(body, { includeGuestIdFields = false } = {}) {
  const updatePayload = pickSelfProfileFields(body, { includeGuestIdFields });

  if (!Object.keys(updatePayload).length) {
    return {
      error: {
        status: 400,
        message: includeGuestIdFields
          ? "Chỉ được cập nhật họ tên, số điện thoại và CCCD"
          : "Chỉ được cập nhật họ tên và số điện thoại",
      },
    };
  }

  if (updatePayload.name !== undefined) {
    const name = String(updatePayload.name).trim();
    if (!name) return { error: { status: 400, message: "Họ và tên không được để trống" } };
    updatePayload.name = name;
  }

  if (updatePayload.phone !== undefined) {
    const phone = String(updatePayload.phone).trim();
    if (!phone) return { error: { status: 400, message: "Số điện thoại không được để trống" } };
    updatePayload.phone = phone;
  }

  if (includeGuestIdFields && updatePayload.idNumber !== undefined) {
    const idNumber = normalizeIdNumber(updatePayload.idNumber);
    if (!idNumber) {
      return { error: { status: 400, message: "Số CCCD/CMND là bắt buộc" } };
    }
    if (!ID_NUMBER_PATTERN.test(idNumber)) {
      return {
        error: { status: 400, message: "Số CCCD/CMND phải gồm 9 hoặc 12 chữ số" },
      };
    }
    updatePayload.idNumber = idNumber;
  }

  return { payload: updatePayload };
}

module.exports = {
  SELF_PROFILE_FIELDS,
  GUEST_PROFILE_FIELDS,
  PROFILE_DB_SELECT,
  ID_NUMBER_PATTERN,
  normalizeIdNumber,
  isCompleteGuestId,
  toUserIdString,
  profileIdsMatch,
  buildValidatedSelfProfilePayload,
  toPublicProfile,
};
