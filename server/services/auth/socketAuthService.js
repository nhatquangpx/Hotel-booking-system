const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Hotel = require("../../models/Hotel");
const { findHotelByStaffId } = require("../hotels/staffHotel");

async function verifySocketToken(token) {
  if (!token) {
    throw new Error("Authentication error: No token provided");
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id).select("_id role name email");
  if (!user) {
    throw new Error("Authentication error: User not found");
  }

  return {
    userId: user._id.toString(),
    userRole: user.role,
    user,
  };
}

async function getSocketHotelRoomIds(userId, userRole) {
  if (userRole === "owner") {
    const hotels = await Hotel.find({ ownerId: userId }).select("_id").lean();
    return hotels.map((h) => String(h._id));
  }

  if (userRole === "staff") {
    const hotel = await findHotelByStaffId(userId);
    return hotel?._id ? [String(hotel._id)] : [];
  }

  return [];
}

module.exports = {
  verifySocketToken,
  getSocketHotelRoomIds,
};
