const Booking = require("../../models/Booking");
const { findHotelByStaffId, staffCanAccessHotel } = require("../../services/hotels/staffHotel");
const { getBookingWithPopulate } = require("./core");
const { checkInBooking, checkOutBooking } = require("./hotelTeam");

const STAFF_BOOKING_POPULATE = {
  hotel: "name address images starRating contactInfo policies",
  room: "roomNumber type price images maxPeople description facilities",
  guest: "name email phone",
};

function throwHttp(statusCode, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  throw err;
}

function getHotelIdFromBooking(booking) {
  if (!booking?.hotel) return null;
  const hotel = booking.hotel;
  if (hotel._id) return hotel._id.toString();
  return hotel.toString();
}

async function assertStaffCanAccessBooking(booking, staffUserId) {
  const hotelId = getHotelIdFromBooking(booking);
  if (!hotelId || !(await staffCanAccessHotel(staffUserId, hotelId))) {
    throwHttp(403, "Bạn không có quyền thực hiện thao tác này");
  }
}

const getBookingsByStaff = async (staffUserId, options = {}) => {
  const {
    page,
    limit,
    all,
    view = "all",
    showPastBookings,
    statusFilter,
    methodFilter,
    proofFilter,
    search,
    actionSearch,
    actionType,
  } = options;

  const {
    parsePaginationQuery,
    buildPaginationMeta,
    paginatedBody,
  } = require("../../lib/http/pagination");
  const {
    BOOKING_POPULATE,
    buildOwnerBookingFilterQuery,
    buildStaffActionBookingQuery,
    buildBookingSearchFilter,
    startOfDay,
    endOfDay,
  } = require("./listQuery");

  const hotel = await findHotelByStaffId(staffUserId);
  if (!hotel) {
    if (all === true || all === "true") return [];
    return paginatedBody([], buildPaginationMeta({ page: 1, limit: limit || 12, total: 0 }), "bookings");
  }

  const conditions = [{ hotel: hotel._id }];

  if (view === "action") {
    conditions.push(buildStaffActionBookingQuery());
    const q = String(actionSearch || "").trim();
    if (q) {
      const searchFilter = await buildBookingSearchFilter(q, { hotelIds: [hotel._id] });
      if (searchFilter) conditions.push(searchFilter);
    }
    if (actionType === "checkin") {
      const today = startOfDay();
      const dayEnd = endOfDay();
      conditions.push({
        paymentStatus: "paid",
        checkedInAt: null,
        checkInDate: { $gte: today, $lte: dayEnd },
      });
    } else if (actionType === "checkout") {
      const today = startOfDay();
      const dayEnd = endOfDay();
      conditions.push({
        paymentStatus: "paid",
        checkedInAt: { $ne: null },
        checkedOutAt: null,
        $or: [
          { checkOutDate: { $gte: today, $lte: dayEnd } },
          { checkOutDate: { $lt: today } },
        ],
      });
    } else if (actionType === "overstay") {
      const today = startOfDay();
      conditions.push({
        paymentStatus: "paid",
        checkedInAt: { $ne: null },
        checkedOutAt: null,
        checkOutDate: { $lt: today },
      });
    }
  } else {
    const filterQuery = buildOwnerBookingFilterQuery({
      showPastBookings,
      statusFilter,
      methodFilter,
      proofFilter,
    });
    if (Object.keys(filterQuery).length) conditions.push(filterQuery);

    const q = String(search || "").trim();
    if (q) {
      const searchFilter = await buildBookingSearchFilter(q, { hotelIds: [hotel._id] });
      if (searchFilter) conditions.push(searchFilter);
    }
  }

  const mongoQuery = conditions.length > 1 ? { $and: conditions } : { hotel: hotel._id };
  const pag = parsePaginationQuery({ page, limit, all }, { defaultLimit: 12, maxLimit: 100 });

  if (pag.all) {
    return Booking.find(mongoQuery)
      .populate(BOOKING_POPULATE)
      .sort({ createdAt: -1 });
  }

  const [bookings, total] = await Promise.all([
    Booking.find(mongoQuery)
      .populate(BOOKING_POPULATE)
      .sort({ createdAt: -1 })
      .skip(pag.skip)
      .limit(pag.limit),
    Booking.countDocuments(mongoQuery),
  ]);

  return paginatedBody(
    bookings,
    buildPaginationMeta({ page: pag.page, limit: pag.limit, total }),
    "bookings"
  );
};

const getBookingById = async (bookingId, user) => {
  const booking = await getBookingWithPopulate(bookingId, STAFF_BOOKING_POPULATE);
  if (!booking) {
    throwHttp(404, "Không tìm thấy đơn đặt phòng");
  }
  await assertStaffCanAccessBooking(booking, user.id);
  return booking;
};

const checkIn = checkInBooking;
const checkOut = checkOutBooking;

module.exports = {
  getBookingsByStaff,
  getBookingById,
  checkIn,
  checkOut,
};
