const User = require('../../models/User');
const bcrypt = require('bcryptjs');
const { isValidObjectId } = require('../../utils/mongooseIds');
const { enrichUserWithStaffHotel } = require('../../utils/staffHotel');
const {
  buildValidatedSelfProfilePayload,
  PROFILE_DB_SELECT,
  toPublicProfile,
} = require('../../utils/selfProfile');

function httpError(status, message) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function assertValidUserId(userId) {
  if (!userId) {
    throw httpError(400, 'ID người dùng không được cung cấp!');
  }
  if (!isValidObjectId(userId)) {
    throw httpError(400, 'ID người dùng không hợp lệ!');
  }
}

async function getProfileById(userId) {
  assertValidUserId(userId);

  const user = await User.findById(userId).select(PROFILE_DB_SELECT);
  if (!user) {
    throw httpError(404, 'Người dùng không tồn tại!');
  }

  const enriched = await enrichUserWithStaffHotel(user);
  return toPublicProfile(enriched);
}

async function updateSelfProfile(userId, body) {
  assertValidUserId(userId);

  const built = buildValidatedSelfProfilePayload(body);
  if (built.error) {
    throw httpError(built.error.status, built.error.message);
  }

  try {
    const updatedUser = await User.findByIdAndUpdate(userId, built.payload, {
      new: true,
      runValidators: true,
    }).select(PROFILE_DB_SELECT);

    if (!updatedUser) {
      throw httpError(404, 'Người dùng không tồn tại!');
    }

    const enriched = await enrichUserWithStaffHotel(updatedUser);
    return toPublicProfile(enriched);
  } catch (err) {
    if (err.status) throw err;
    if (err.name === 'CastError') {
      throw httpError(400, 'ID người dùng không hợp lệ!');
    }
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0];
      const label =
        field === 'email' ? 'Email' : field === 'phone' ? 'Số điện thoại' : 'Thông tin';
      throw httpError(400, `${label} đã được sử dụng`);
    }
    throw err;
  }
}

async function changeUserPassword(userId, { currentPassword, newPassword }) {
  assertValidUserId(userId);

  if (!currentPassword || !newPassword) {
    throw httpError(400, 'Vui lòng nhập đầy đủ mật khẩu hiện tại và mật khẩu mới');
  }

  if (newPassword.length < 6) {
    throw httpError(400, 'Mật khẩu mới phải có ít nhất 6 ký tự');
  }

  const user = await User.findById(userId);
  if (!user) {
    throw httpError(404, 'Không tìm thấy người dùng');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw httpError(400, 'Mật khẩu hiện tại không chính xác');
  }

  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw httpError(400, 'Mật khẩu mới không được trùng với mật khẩu cũ');
  }

  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  await user.save();

  return { success: true, message: 'Đổi mật khẩu thành công' };
}

module.exports = {
  getProfileById,
  updateSelfProfile,
  changeUserPassword,
};
