const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const { isValidObjectId } = require("../../lib/ids/mongooseIds");
const {
  syncStaffHotelAssignment,
  removeStaffFromAllHotels,
  enrichUserWithStaffHotel,
  enrichUsersWithStaffHotels,
  findHotelByStaffId,
  assertHotelExists,
  assertStaffNotInOtherHotel,
  assignStaffToHotel,
} = require("../hotels/staffHotel");
const { ServiceError } = require("../../lib/http/serviceError");

const VALID_ROLES = ["guest", "admin", "owner", "staff"];

function wrapStaffError(error) {
  if (error instanceof ServiceError) throw error;
  if (error?.status) {
    throw new ServiceError(error.status, error.message || "Lỗi gán nhân viên");
  }
  throw error;
}

async function getAllUsers() {
  const users = await User.find().select("-password");
  const enriched = await enrichUsersWithStaffHotels(users);
  return { status: 200, body: enriched };
}

async function createUser(body) {
  const { name, email, password, phone, role, status, assignedHotelId } = body;
  if (!name || !email || !password || !phone) {
    throw new ServiceError(400, "Không được để trống các trường bắt buộc!");
  }

  const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
  if (existingUser) {
    if (existingUser.email === email) throw new ServiceError(400, "Email đã được sử dụng!");
    if (existingUser.phone === phone) throw new ServiceError(400, "Số điện thoại đã được sử dụng!");
  }

  const userRole = role || "guest";
  if (!VALID_ROLES.includes(userRole)) throw new ServiceError(400, "Role không hợp lệ!");
  if (userRole === "staff" && !assignedHotelId) {
    throw new ServiceError(400, "Nhân viên phải được gán một khách sạn");
  }
  if (userRole === "staff") {
    try {
      await assertHotelExists(assignedHotelId);
    } catch (e) {
      wrapStaffError(e);
    }
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = new User({
    name,
    email,
    password: hashedPassword,
    phone,
    role: userRole,
    status: status || "active",
  });
  await newUser.save();

  try {
    await syncStaffHotelAssignment({
      userId: newUser._id,
      nextRole: userRole,
      hotelId: assignedHotelId,
      currentRole: null,
    });
  } catch (syncErr) {
    await User.findByIdAndDelete(newUser._id);
    wrapStaffError(syncErr);
  }

  const saved = await enrichUserWithStaffHotel(
    await User.findById(newUser._id).select("-password")
  );
  console.log(`Đã tạo user thành công: ${newUser._id} (${newUser.email}) với role ${newUser.role}`);
  return { status: 201, body: { message: "Người dùng đã được tạo thành công!", user: saved } };
}

async function updateUser({ userId, body }) {
  if (!userId) throw new ServiceError(400, "ID người dùng không được cung cấp!");
  if (!isValidObjectId(userId)) throw new ServiceError(400, "ID người dùng không hợp lệ!");

  if (body.status && !["active", "inactive"].includes(body.status)) {
    throw new ServiceError(400, "Trạng thái không hợp lệ!");
  }

  const updatePayload = { ...body };
  delete updatePayload.wishlist;

  const existingUser = await User.findById(userId);
  if (!existingUser) throw new ServiceError(404, "Người dùng không tồn tại!");

  const nextRole = updatePayload.role ?? existingUser.role;
  if (updatePayload.role && !VALID_ROLES.includes(updatePayload.role)) {
    throw new ServiceError(400, "Role không hợp lệ!");
  }

  const staffHotelId = updatePayload.assignedHotelId;
  delete updatePayload.assignedHotelId;

  if (Object.prototype.hasOwnProperty.call(updatePayload, "password")) {
    const raw = updatePayload.password;
    if (raw === undefined || raw === null || String(raw).trim() === "") {
      delete updatePayload.password;
    } else {
      const plain = String(raw);
      if (plain.length < 6) throw new ServiceError(400, "Mật khẩu phải có ít nhất 6 ký tự");
      updatePayload.password = await bcrypt.hash(plain, 10);
    }
  }

  let currentStaffHotelId = null;
  if (existingUser.role === "staff") {
    const h = await findHotelByStaffId(existingUser._id);
    currentStaffHotelId = h?._id;
  }

  const hotelIdForStaff = staffHotelId ?? currentStaffHotelId;
  const previousStaffHotelId = currentStaffHotelId;

  if (nextRole === "staff") {
    if (!hotelIdForStaff) throw new ServiceError(400, "Nhân viên phải được gán một khách sạn");
    try {
      await assertHotelExists(hotelIdForStaff);
      await assertStaffNotInOtherHotel(userId, hotelIdForStaff);
      await syncStaffHotelAssignment({
        userId,
        nextRole: "staff",
        hotelId: hotelIdForStaff,
        currentRole: existingUser.role,
      });
    } catch (e) {
      wrapStaffError(e);
    }
  }

  let updatedUser;
  try {
    updatedUser = await User.findByIdAndUpdate(userId, updatePayload, { new: true }).select("-password");
  } catch (updateErr) {
    if (nextRole === "staff") {
      if (existingUser.role !== "staff") await removeStaffFromAllHotels(userId);
      else if (previousStaffHotelId) await assignStaffToHotel(userId, previousStaffHotelId);
      else await removeStaffFromAllHotels(userId);
    }
    throw updateErr;
  }

  if (!updatedUser) {
    if (nextRole === "staff") {
      if (existingUser.role !== "staff") await removeStaffFromAllHotels(userId);
      else if (previousStaffHotelId) await assignStaffToHotel(userId, previousStaffHotelId);
      else await removeStaffFromAllHotels(userId);
    }
    throw new ServiceError(404, "Người dùng không tồn tại!");
  }

  if (nextRole !== "staff" && existingUser.role === "staff") {
    try {
      await syncStaffHotelAssignment({
        userId: updatedUser._id,
        nextRole,
        hotelId: null,
        currentRole: "staff",
      });
    } catch (demoteErr) {
      await removeStaffFromAllHotels(userId);
      wrapStaffError(demoteErr);
    }
  }

  const enriched = await enrichUserWithStaffHotel(updatedUser);
  console.log(`Đã cập nhật user thành công: ${userId}`);
  return { status: 200, body: enriched };
}

async function deleteUser({ userId }) {
  if (!isValidObjectId(userId)) throw new ServiceError(400, "ID người dùng không hợp lệ!");

  const deletedUser = await User.findByIdAndDelete(userId);
  if (!deletedUser) throw new ServiceError(404, "Người dùng không tồn tại!");

  if (deletedUser.role === "staff") await removeStaffFromAllHotels(deletedUser._id);

  console.log(`Đã xóa user thành công: ${userId}`);
  return { status: 200, body: { message: "Người dùng đã được xóa thành công!" } };
}

module.exports = { getAllUsers, createUser, updateUser, deleteUser };
