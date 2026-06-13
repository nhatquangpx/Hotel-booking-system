const mongoose = require("mongoose");
const Hotel = require("../../models/Hotel");
const { isValidObjectId } = require("../../lib/ids/mongooseIds");

function assertStaffUserId(userId) {
  if (!userId || !isValidObjectId(userId)) {
    const err = new Error("ID người dùng nhân viên không hợp lệ");
    err.status = 400;
    throw err;
  }
}

async function assertHotelExists(hotelId) {
  if (!hotelId || !isValidObjectId(hotelId)) {
    const err = new Error("ID khách sạn không hợp lệ");
    err.status = 400;
    throw err;
  }
  const hotel = await Hotel.findById(hotelId).select("_id name");
  if (!hotel) {
    const err = new Error("Khách sạn không tồn tại");
    err.status = 404;
    throw err;
  }
  return hotel;
}

async function findHotelByStaffId(userId) {
  if (!userId || !isValidObjectId(userId)) return null;
  return Hotel.findOne({ staffIds: userId }).select(
    "name _id status staffIds maintenanceContactEmail address"
  );
}

async function assertStaffNotInOtherHotel(userId, exceptHotelId = null) {
  assertStaffUserId(userId);
  const filter = { staffIds: userId };
  if (exceptHotelId) filter._id = { $ne: exceptHotelId };
  const other = await Hotel.findOne(filter).select("name _id");
  if (other) {
    const err = new Error(
      `Nhân viên đã được gán cho khách sạn "${other.name}". Mỗi nhân viên chỉ làm việc tại một khách sạn.`
    );
    err.status = 400;
    throw err;
  }
}

async function assignStaffToHotel(userId, hotelId) {
  assertStaffUserId(userId);
  await assertHotelExists(hotelId);
  await assertStaffNotInOtherHotel(userId, hotelId);
  await Hotel.updateMany(
    { staffIds: userId },
    { $pull: { staffIds: new mongoose.Types.ObjectId(userId) } }
  );
  await Hotel.findByIdAndUpdate(hotelId, {
    $addToSet: { staffIds: new mongoose.Types.ObjectId(userId) },
  });
}

async function removeStaffFromAllHotels(userId) {
  if (!userId) return;
  assertStaffUserId(userId);
  await Hotel.updateMany(
    { staffIds: userId },
    { $pull: { staffIds: new mongoose.Types.ObjectId(userId) } }
  );
}

async function syncStaffHotelAssignment({ userId, nextRole, hotelId, currentRole }) {
  if (nextRole === "staff") {
    if (!hotelId) {
      const err = new Error("Nhân viên phải được gán một khách sạn");
      err.status = 400;
      throw err;
    }
    await assignStaffToHotel(userId, hotelId);
    return;
  }
  if (currentRole === "staff") {
    await removeStaffFromAllHotels(userId);
  }
}

async function staffCanAccessHotel(userId, hotelId) {
  if (!userId || !hotelId) return false;
  if (!isValidObjectId(userId) || !isValidObjectId(hotelId)) return false;
  const hotel = await Hotel.findOne({ _id: hotelId, staffIds: userId }).select("_id");
  return !!hotel;
}

async function enrichUserWithStaffHotel(user) {
  const plain = user?.toObject ? user.toObject() : { ...user };
  if (plain.role !== "staff") {
    plain.assignedHotelId = null;
    return plain;
  }
  const hotel = await findHotelByStaffId(plain._id);
  plain.assignedHotelId = hotel ? { _id: hotel._id, name: hotel.name } : null;
  return plain;
}

async function enrichUsersWithStaffHotels(users) {
  const list = users.map((u) => (u?.toObject ? u.toObject() : { ...u }));
  const staffIds = list.filter((u) => u.role === "staff").map((u) => u._id);
  if (!staffIds.length) {
    return list.map((u) => ({ ...u, assignedHotelId: null }));
  }

  const hotels = await Hotel.find({ staffIds: { $in: staffIds } }).select("name _id staffIds");
  const hotelByStaffId = new Map();
  for (const hotel of hotels) {
    for (const sid of hotel.staffIds || []) {
      hotelByStaffId.set(String(sid), { _id: hotel._id, name: hotel.name });
    }
  }

  return list.map((u) => ({
    ...u,
    assignedHotelId:
      u.role === "staff" ? hotelByStaffId.get(String(u._id)) || null : null,
  }));
}

module.exports = {
  assertHotelExists,
  findHotelByStaffId,
  assignStaffToHotel,
  removeStaffFromAllHotels,
  syncStaffHotelAssignment,
  staffCanAccessHotel,
  enrichUserWithStaffHotel,
  enrichUsersWithStaffHotels,
  assertStaffNotInOtherHotel,
};
