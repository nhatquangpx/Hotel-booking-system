const bcrypt = require("bcryptjs");
const User = require("../../models/User");
const Hotel = require("../../models/Hotel");
const { isValidObjectId } = require("../../lib/ids/mongooseIds");
const {
  parsePaginationQuery,
  buildPaginationMeta,
  escapeRegex,
  paginatedBody,
} = require("../../lib/http/pagination");
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

const HOTEL_VIEW_SEPARATE_ROLES = ["guest", "admin"];

function buildUserSearchQuery({ searchName, searchEmail, searchPhone }) {
  const query = {};
  const name = String(searchName || "").trim();
  const email = String(searchEmail || "").trim();
  const phone = String(searchPhone || "").trim();
  if (name) query.name = { $regex: escapeRegex(name), $options: "i" };
  if (email) query.email = { $regex: escapeRegex(email), $options: "i" };
  if (phone) query.phone = { $regex: escapeRegex(phone), $options: "i" };
  return query;
}

function getOwnerId(hotel) {
  const owner = hotel.ownerId;
  if (!owner) return null;
  return String(owner._id || owner);
}

function getStaffForHotel(hotel, usersById) {
  const seen = new Set();
  const staff = [];

  for (const user of usersById.values()) {
    if (user.role !== "staff") continue;
    const hotelId = user.assignedHotelId?._id || user.assignedHotelId;
    if (hotelId && String(hotelId) === String(hotel._id) && !seen.has(String(user._id))) {
      seen.add(String(user._id));
      staff.push(user);
    }
  }

  for (const rawId of hotel.staffIds || []) {
    const id = String(rawId._id || rawId);
    if (seen.has(id)) continue;
    const user = usersById.get(id);
    if (user?.role === "staff") {
      seen.add(id);
      staff.push(user);
    }
  }

  return staff;
}

function buildHotelViewGroups(hotels, filteredUsers, allUsers) {
  const filteredIds = new Set(filteredUsers.map((u) => String(u._id)));
  const usersById = new Map(allUsers.map((u) => [String(u._id), u]));

  const hotelGroups = hotels
    .map((hotel) => {
      const ownerId = getOwnerId(hotel);
      const owner = ownerId ? usersById.get(ownerId) : null;
      const staff = getStaffForHotel(hotel, usersById);
      const visibleOwner = owner && filteredIds.has(String(owner._id)) ? owner : null;
      const visibleStaff = staff.filter((s) => filteredIds.has(String(s._id)));
      return {
        hotel,
        owner: visibleOwner,
        staff: visibleStaff,
        hasVisibleMembers: Boolean(visibleOwner) || visibleStaff.length > 0,
      };
    })
    .filter((g) => g.hasVisibleMembers);

  const assignedStaffIds = new Set();
  const assignedOwnerIds = new Set();
  for (const group of hotelGroups) {
    if (group.owner) assignedOwnerIds.add(String(group.owner._id));
    for (const s of group.staff) assignedStaffIds.add(String(s._id));
  }

  const orphanStaff = filteredUsers.filter(
    (u) => u.role === "staff" && !assignedStaffIds.has(String(u._id))
  );
  const orphanOwners = filteredUsers.filter(
    (u) => u.role === "owner" && !assignedOwnerIds.has(String(u._id))
  );

  const separateRoleUsers = filteredUsers.filter((u) => HOTEL_VIEW_SEPARATE_ROLES.includes(u.role));
  const separateRoleGroups = {};
  for (const role of HOTEL_VIEW_SEPARATE_ROLES) {
    separateRoleGroups[role] = separateRoleUsers.filter((u) => u.role === role);
  }

  return { hotelGroups, orphanStaff, orphanOwners, separateRoleGroups };
}

async function getAllUsers({
  page,
  limit,
  all,
  view = "list",
  searchName,
  searchEmail,
  searchPhone,
}) {
  const userQuery = buildUserSearchQuery({ searchName, searchEmail, searchPhone });
  const pag = parsePaginationQuery({ page, limit, all }, { defaultLimit: 15, maxLimit: 100 });

  if (view === "hotel") {
    const hotelPag = parsePaginationQuery(
      { page, limit, all: false },
      { defaultLimit: 5, maxLimit: 50 }
    );

    const [filteredUsers, allUsers, hotels] = await Promise.all([
      User.find(userQuery).select("-password").lean(),
      User.find().select("-password").lean(),
      Hotel.find().populate({ path: "ownerId", select: "name email phone _id" }).sort({ name: 1 }),
    ]);

    const enrichedFiltered = await enrichUsersWithStaffHotels(filteredUsers);
    const enrichedAll = await enrichUsersWithStaffHotels(allUsers);
    const { hotelGroups, orphanStaff, orphanOwners, separateRoleGroups } = buildHotelViewGroups(
      hotels,
      enrichedFiltered,
      enrichedAll
    );

    const total = hotelGroups.length;
    const pagedHotelGroups = hotelPag.all
      ? hotelGroups
      : hotelGroups.slice(hotelPag.skip, hotelPag.skip + hotelPag.limit);

    return {
      status: 200,
      body: {
        hotelGroups: pagedHotelGroups,
        orphanStaff,
        orphanOwners,
        separateRoleGroups,
        pagination: buildPaginationMeta({
          page: hotelPag.page,
          limit: hotelPag.limit,
          total,
        }),
      },
    };
  }

  if (pag.all) {
    const users = await User.find(userQuery).select("-password");
    const enriched = await enrichUsersWithStaffHotels(users);
    return { status: 200, body: enriched };
  }

  const [users, total] = await Promise.all([
    User.find(userQuery).select("-password").sort({ createdAt: -1 }).skip(pag.skip).limit(pag.limit),
    User.countDocuments(userQuery),
  ]);
  const enriched = await enrichUsersWithStaffHotels(users);

  return {
    status: 200,
    body: paginatedBody(
      enriched,
      buildPaginationMeta({ page: pag.page, limit: pag.limit, total }),
      "users"
    ),
  };
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
  delete updatePayload.inactiveDays;

  const existingUser = await User.findById(userId);
  if (!existingUser) throw new ServiceError(404, "Người dùng không tồn tại!");

  if (updatePayload.status === "active") {
    updatePayload.inactiveUntil = null;
    updatePayload.inactiveReason = "";
  } else if (updatePayload.status === "inactive") {
    if (Object.prototype.hasOwnProperty.call(body, "inactiveUntil")) {
      updatePayload.inactiveUntil = body.inactiveUntil
        ? new Date(body.inactiveUntil)
        : null;
    }
    if (Object.prototype.hasOwnProperty.call(body, "inactiveReason")) {
      updatePayload.inactiveReason = String(body.inactiveReason || "").trim();
    }
    if (Object.prototype.hasOwnProperty.call(body, "inactiveDays")) {
      const days = Number(body.inactiveDays);
      if (Number.isFinite(days) && days > 0) {
        updatePayload.inactiveUntil = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
      } else if (body.inactiveDays === null || body.inactiveDays === 0 || body.inactiveDays === "") {
        updatePayload.inactiveUntil = null;
      }
    }
    updatePayload.refreshTokenHash = null;
    updatePayload.refreshTokenExpires = null;
  }

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
