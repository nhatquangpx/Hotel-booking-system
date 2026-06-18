const Booking = require("../../models/Booking");
const Hotel = require("../../models/Hotel");
const User = require("../../models/User");
const {
  parsePaginationQuery,
  buildPaginationMeta,
  escapeRegex,
  paginatedBody,
} = require("../../lib/http/pagination");
const {
  BOOKING_POPULATE,
  buildAdminBookingFilterQuery,
} = require("./listQuery");

function groupBookingsByHotel(bookings, hotels = []) {
  const hotelMap = new Map(hotels.map((hotel) => [String(hotel._id), hotel]));
  const groups = new Map();

  for (const booking of bookings) {
    const hotel = booking.hotel;
    const hotelId = hotel?._id ? String(hotel._id) : hotel ? String(hotel) : "";
    const key = hotelId || "__unknown__";
    if (!groups.has(key)) {
      const hotelDoc = hotelMap.get(hotelId);
      groups.set(key, {
        hotelId,
        hotelName: hotel?.name || booking.hotelName || hotelDoc?.name || "Khách sạn không xác định",
        hotelAddress: hotelDoc?.address || hotel?.address || null,
        bookings: [],
      });
    }
    groups.get(key).bookings.push(booking);
  }

  return Array.from(groups.values()).sort((a, b) =>
    a.hotelName.localeCompare(b.hotelName, "vi")
  );
}

/**
 * Get all bookings (admin only) — hỗ trợ phân trang server-side.
 */
const getAllBookings = async ({
  page,
  limit,
  all,
  view = "list",
  searchTerm,
  searchEmail,
  searchPhone,
  searchCode,
  searchHotelName,
  startDate,
  endDate,
}) => {
  const { bookingMatch, guestQuery, hotelName } = buildAdminBookingFilterQuery({
    searchTerm,
    searchEmail,
    searchPhone,
    searchCode,
    searchHotelName,
    startDate,
    endDate,
  });

  const mongoConditions = [];
  if (Object.keys(bookingMatch).length) mongoConditions.push(bookingMatch);

  if (Object.keys(guestQuery).length) {
    const guests = await User.find(guestQuery).select("_id");
    const guestIds = guests.map((g) => g._id);
    if (!guestIds.length) {
      const pag = parsePaginationQuery({ page, limit, all }, { defaultLimit: 20, maxLimit: 100 });
      if (pag.all) return [];
      if (view === "hotel") {
        return {
          hotelGroups: [],
          pagination: buildPaginationMeta({ page: pag.page, limit: pag.limit, total: 0 }),
        };
      }
      return paginatedBody([], buildPaginationMeta({ page: pag.page, limit: pag.limit, total: 0 }), "bookings");
    }
    mongoConditions.push({ guest: { $in: guestIds } });
  }

  if (hotelName) {
    const hotels = await Hotel.find({
      name: { $regex: escapeRegex(hotelName), $options: "i" },
    }).select("_id");
    const hotelIds = hotels.map((h) => h._id);
    if (!hotelIds.length) {
      const pag = parsePaginationQuery({ page, limit, all }, { defaultLimit: 20, maxLimit: 100 });
      if (pag.all) return [];
      if (view === "hotel") {
        return {
          hotelGroups: [],
          pagination: buildPaginationMeta({ page: pag.page, limit: pag.limit, total: 0 }),
        };
      }
      return paginatedBody([], buildPaginationMeta({ page: pag.page, limit: pag.limit, total: 0 }), "bookings");
    }
    mongoConditions.push({ hotel: { $in: hotelIds } });
  }

  const mongoQuery = mongoConditions.length ? { $and: mongoConditions } : {};

  const pag = parsePaginationQuery({ page, limit, all }, { defaultLimit: 20, maxLimit: 100 });

  if (view === "hotel") {
    const hotelPag = parsePaginationQuery({ page, limit, all: false }, { defaultLimit: 5, maxLimit: 50 });
    const [bookings, hotels] = await Promise.all([
      Booking.find(mongoQuery)
        .populate(BOOKING_POPULATE)
        .sort({ createdAt: -1 }),
      Hotel.find().select("name address"),
    ]);
    const hotelGroups = groupBookingsByHotel(bookings, hotels);
    const total = hotelGroups.length;
    const pagedGroups = hotelGroups.slice(hotelPag.skip, hotelPag.skip + hotelPag.limit);
    return {
      hotelGroups: pagedGroups,
      pagination: buildPaginationMeta({ page: hotelPag.page, limit: hotelPag.limit, total }),
    };
  }

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

const getUserBookings = async (userId) => {
  const bookings = await Booking.find({ guest: userId })
    .populate({ path: "hotel", select: "name" })
    .populate({ path: "room", select: "roomNumber" })
    .sort({ createdAt: -1 });

  return bookings.map((b) => ({
    _id: b._id,
    hotelId: b.hotel?._id,
    hotelName: b.hotel?.name,
    roomId: b.room?._id,
    roomNumber: b.room?.roomNumber,
    checkIn: b.checkInDate,
    checkOut: b.checkOutDate,
    status: b.paymentStatus,
  }));
};

const {
  getBookingById: getBookingByIdCore,
} = require("./core");

const getBookingById = async (bookingId, user) => {
  return await getBookingByIdCore(bookingId, user, {
    hotel: "name address images starRating contactInfo policies +paymentConfig",
    room: "roomNumber type price images maxPeople description facilities",
    guest: "name email phone",
  });
};

module.exports = {
  getAllBookings,
  getUserBookings,
  getBookingById,
};
