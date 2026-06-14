const hotelAccess = require("../services/hotels/hotelAccessService");
const { ServiceError } = require("../lib/http/serviceError");

function respondMiddlewareError(res, error) {
  if (error instanceof ServiceError) {
    return res.status(error.statusCode).json({ message: error.message });
  }
  return res.status(500).json({ message: "Lỗi server", error: error.message });
}

exports.verifyOwnerOrAdmin = async (req, res, next) => {
  try {
    const hotelId = req.params.id || req.params.hotelId;
    const ctx = await hotelAccess.resolveHotelTeamAccess(hotelId, req.user);
    if (ctx.hotel) req.hotel = ctx.hotel;
    if (ctx.staffHotelId) req.staffHotelId = ctx.staffHotelId;
    next();
  } catch (error) {
    return respondMiddlewareError(res, error);
  }
};

exports.verifyAdmin = (req, res, next) => {
  if (req.user.role === "admin") return next();
  return res.status(403).json({ message: "Chỉ Admin mới có quyền thực hiện hành động này" });
};

exports.attachStaffHotel = async (req, res, next) => {
  try {
    if (req.user.role !== "staff") return next();

    const ctx = await hotelAccess.getStaffAssignedHotel(req.user.id);
    req.staffHotelId = ctx.staffHotelId;
    req.hotel = ctx.hotel;
    next();
  } catch (error) {
    return respondMiddlewareError(res, error);
  }
};

exports.verifyRoomOwnerOrAdmin = async (req, res, next) => {
  try {
    const ctx = await hotelAccess.resolveRoomTeamAccess(req.params.id, req.user);
    if (ctx.room) req.room = ctx.room;
    if (ctx.hotel) req.hotel = ctx.hotel;
    if (ctx.staffHotelId) req.staffHotelId = ctx.staffHotelId;
    next();
  } catch (error) {
    return respondMiddlewareError(res, error);
  }
};
