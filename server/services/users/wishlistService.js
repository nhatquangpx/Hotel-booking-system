const mongoose = require("mongoose");
const User = require("../../models/User");
const Hotel = require("../../models/Hotel");
const { isValidObjectId } = require("../../lib/ids/mongooseIds");
const { isGuestBookableHotelStatus } = require("../../services/hotels/status");
const { ServiceError } = require("../../lib/http/serviceError");

async function getWishlist({ userId }) {
  const user = await User.findById(userId).populate("wishlist");
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");

  const hotels = (user.wishlist || [])
    .filter((h) => h && h._id)
    .map((h) => {
      const plain = h.toObject ? h.toObject() : { ...h };
      return { ...plain, guestBookable: isGuestBookableHotelStatus(plain.status) };
    });

  return { status: 200, body: { hotels } };
}

async function toggleWishlist({ userId, hotelId }) {
  if (!isValidObjectId(hotelId)) throw new ServiceError(400, "ID khách sạn không hợp lệ!");

  const hotel = await Hotel.findById(hotelId);
  if (!hotel) throw new ServiceError(404, "Khách sạn không tồn tại!");

  const user = await User.findById(userId);
  if (!user) throw new ServiceError(404, "Người dùng không tồn tại!");

  if (!Array.isArray(user.wishlist)) user.wishlist = [];

  const hid = new mongoose.Types.ObjectId(hotelId);
  const wasIn = user.wishlist.some((id) => id.equals(hid));

  if (wasIn) {
    user.wishlist = user.wishlist.filter((id) => !id.equals(hid));
  } else {
    if (!isGuestBookableHotelStatus(hotel.status)) {
      throw new ServiceError(
        400,
        "Chỉ có thể lưu khách sạn đang hoạt động vào danh sách yêu thích."
      );
    }
    user.wishlist.push(hid);
  }
  await user.save();

  return { status: 200, body: { wishlisted: !wasIn } };
}

module.exports = { getWishlist, toggleWishlist };
