const { escapeRegex } = require("../../lib/http/pagination");

function startOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date = new Date()) {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function buildAdminBookingFilterQuery({
  searchTerm,
  searchEmail,
  searchPhone,
  searchCode,
  searchHotelName,
  startDate,
  endDate,
}) {
  const bookingConditions = [];

  const code = String(searchCode || "").trim();
  const hotelName = String(searchHotelName || "").trim();

  if (code) {
    bookingConditions.push({ _id: { $regex: escapeRegex(code), $options: "i" } });
  }
  if (startDate) {
    bookingConditions.push({ checkInDate: { $gte: new Date(startDate) } });
  }
  if (endDate) {
    bookingConditions.push({ checkOutDate: { $lte: new Date(endDate) } });
  }

  const guestQuery = {};
  const term = String(searchTerm || "").trim();
  const email = String(searchEmail || "").trim();
  const phone = String(searchPhone || "").trim();
  if (term) guestQuery.name = { $regex: escapeRegex(term), $options: "i" };
  if (email) guestQuery.email = { $regex: escapeRegex(email), $options: "i" };
  if (phone) guestQuery.phone = { $regex: escapeRegex(phone), $options: "i" };

  return {
    bookingMatch: bookingConditions.length ? { $and: bookingConditions } : {},
    guestQuery,
    hotelName,
  };
}

function buildOwnerBookingFilterQuery({
  showPastBookings,
  statusFilter,
  methodFilter,
  proofFilter,
}) {
  const conditions = [];
  const today = startOfDay();

  if (!showPastBookings || showPastBookings === "false") {
    conditions.push({ checkInDate: { $gte: today } });
  }

  if (statusFilter && statusFilter !== "all") {
    conditions.push({ paymentStatus: statusFilter });
  }

  if (methodFilter && methodFilter !== "all") {
    conditions.push({ paymentMethod: methodFilter });
  }

  if (proofFilter === "proof_submitted") {
    conditions.push({
      paymentMethod: "qr_code",
      qrPaymentReportedAt: { $ne: null },
    });
  } else if (proofFilter === "proof_missing") {
    conditions.push({
      paymentMethod: "qr_code",
      $or: [{ qrPaymentReportedAt: null }, { qrPaymentReportedAt: { $exists: false } }],
    });
  }

  return conditions.length ? { $and: conditions } : {};
}

function buildStaffActionBookingQuery(referenceDate = new Date()) {
  const dayStart = startOfDay(referenceDate);
  const dayEnd = endOfDay(referenceDate);

  return {
    $or: [
      {
        paymentStatus: "paid",
        checkedInAt: null,
        checkInDate: { $gte: dayStart, $lte: dayEnd },
      },
      {
        paymentStatus: "paid",
        checkedInAt: { $ne: null },
        checkedOutAt: null,
        checkOutDate: { $gte: dayStart, $lte: dayEnd },
      },
    ],
  };
}

function buildOwnerActionBookingQuery(referenceDate = new Date()) {
  const dayStart = startOfDay(referenceDate);
  const dayEnd = endOfDay(referenceDate);

  return {
    $or: [
      { paymentStatus: "pending" },
      {
        paymentStatus: "cancelled",
        "guestCancelSnapshot.wasPaid": true,
        "guestCancelSnapshot.refundPolicyEligible": true,
        guestCancelRequestedAt: { $ne: null },
        ownerRefundCompletedAt: null,
      },
      {
        paymentStatus: "paid",
        checkedInAt: null,
        checkInDate: { $gte: dayStart, $lte: dayEnd },
      },
      {
        paymentStatus: "paid",
        checkedInAt: { $ne: null },
        checkedOutAt: null,
        checkOutDate: { $gte: dayStart, $lte: dayEnd },
      },
    ],
  };
}

const BOOKING_POPULATE = [
  { path: "hotel", select: "name address" },
  { path: "room", select: "roomNumber type" },
  { path: "guest", select: "name email phone" },
];

module.exports = {
  BOOKING_POPULATE,
  buildAdminBookingFilterQuery,
  buildOwnerBookingFilterQuery,
  buildOwnerActionBookingQuery,
  buildStaffActionBookingQuery,
  startOfDay,
  endOfDay,
};
