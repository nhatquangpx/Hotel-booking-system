/** Field được phép khi user tự sửa profile (không qua admin CRUD). */
const SELF_PROFILE_FIELDS = ['name', 'phone'];

/** Mongoose .select() — loại password, 2FA secrets, trustedDevices, wishlist, token tạm. */
const PROFILE_DB_SELECT =
  'name email phone role status createdAt updatedAt twoFactorAuth.enabled';

/**
 * Chuẩn hóa document user trước khi trả API profile / getUserById (admin detail).
 */
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

  if (plain.id) {
    out.id = plain.id;
  }

  if (plain.assignedHotelId !== undefined) {
    out.assignedHotelId = plain.assignedHotelId;
  }

  if (plain.twoFactorAuth && typeof plain.twoFactorAuth.enabled === 'boolean') {
    out.twoFactorAuth = { enabled: plain.twoFactorAuth.enabled };
  }

  return out;
}

function toUserIdString(id) {
  return id?.toString?.() || String(id);
}

/** So khớp :id trên route guest với user đang đăng nhập. */
function profileIdsMatch(paramId, authId) {
  if (!paramId || !authId) return false;
  return toUserIdString(paramId) === toUserIdString(authId);
}

function pickSelfProfileFields(body) {
  const payload = {};
  for (const key of SELF_PROFILE_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, key)) {
      payload[key] = body[key];
    }
  }
  return payload;
}

/**
 * @returns {{ payload: object } | { error: { status: number, message: string } }}
 */
function buildValidatedSelfProfilePayload(body) {
  const updatePayload = pickSelfProfileFields(body);

  if (!Object.keys(updatePayload).length) {
    return {
      error: { status: 400, message: 'Chỉ được cập nhật họ tên và số điện thoại' },
    };
  }

  if (updatePayload.name !== undefined) {
    const name = String(updatePayload.name).trim();
    if (!name) {
      return { error: { status: 400, message: 'Họ và tên không được để trống' } };
    }
    updatePayload.name = name;
  }

  if (updatePayload.phone !== undefined) {
    const phone = String(updatePayload.phone).trim();
    if (!phone) {
      return { error: { status: 400, message: 'Số điện thoại không được để trống' } };
    }
    updatePayload.phone = phone;
  }

  return { payload: updatePayload };
}

module.exports = {
  SELF_PROFILE_FIELDS,
  PROFILE_DB_SELECT,
  toUserIdString,
  profileIdsMatch,
  buildValidatedSelfProfilePayload,
  toPublicProfile,
};
