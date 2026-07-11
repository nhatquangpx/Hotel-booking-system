const bookingApi = require("../services/bookings/bookingApiService");
const { runService } = require("../lib/http/controllerHelper");

exports.createBooking = (req, res) =>
  runService(res, () => {
    const { buildSensitiveMediaRef } = require("../services/media/sensitiveMedia");
    const frontFile = req.files?.idImageFront?.[0];
    const backFile = req.files?.idImageBack?.[0];
    const guestIdImageFrontUrl = frontFile
      ? buildSensitiveMediaRef(frontFile, "id-cards")
      : undefined;
    const guestIdImageBackUrl = backFile
      ? buildSensitiveMediaRef(backFile, "id-cards")
      : undefined;

    return bookingApi.createBooking({
      bookingData: {
        hotelId: req.body.hotelId ?? req.body.hotel,
        roomId: req.body.roomId ?? req.body.room,
        checkInDate: req.body.checkInDate,
        checkOutDate: req.body.checkOutDate,
        paymentMethod: req.body.paymentMethod,
        specialRequests: req.body.specialRequests,
        guestCount: req.body.guestCount,
        selectedAddonIds: req.body.selectedAddonIds,
        guestIdNumber: req.body.guestIdNumber,
        guestIdImageFrontUrl,
        guestIdImageBackUrl,
      },
      userId: req.user.id,
    });
  });

/** Stream ảnh nhạy cảm (minh chứng / CCCD) — chỉ user có quyền. */
exports.streamBookingSensitiveMedia = async (req, res) => {
  try {
    const { streamBookingSensitiveMedia } = require("../services/media/bookingSensitiveMedia");
    await streamBookingSensitiveMedia({
      bookingId: req.params.id,
      kind: req.params.kind,
      user: req.user,
      res,
    });
  } catch (err) {
    const status = err.statusCode || err.status || 500;
    if (!res.headersSent) {
      res.status(status).json({ message: err.message || "Không thể tải ảnh" });
    }
  }
};

exports.getPricePreview = (req, res) =>
  runService(res, () => {
    const rawAddonIds = req.query.selectedAddonIds;
    const selectedAddonIds = Array.isArray(rawAddonIds)
      ? rawAddonIds
      : rawAddonIds
        ? String(rawAddonIds).split(",").map((id) => id.trim()).filter(Boolean)
        : [];

    return bookingApi.getPricePreview({
      hotelId: req.query.hotelId,
      roomId: req.query.roomId,
      checkInDate: req.query.checkInDate,
      checkOutDate: req.query.checkOutDate,
      guestCount: req.query.guestCount,
      selectedAddonIds,
    });
  });

exports.getMyBookings = (req, res) =>
  runService(res, () =>
    bookingApi.getMyBookings({
      userId: req.user.id,
      hotelId: req.query.hotelId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: req.query.page,
      limit: req.query.limit,
    })
  );

exports.getUserBookings = (req, res) =>
  runService(res, () => bookingApi.getUserBookings({ userId: req.params.userId }));

exports.getAllBookings = (req, res) =>
  runService(res, () =>
    bookingApi.getAllBookings({
      page: req.query.page,
      limit: req.query.limit,
      all: req.query.all,
      view: req.query.view,
      searchTerm: req.query.searchTerm,
      searchEmail: req.query.searchEmail,
      searchPhone: req.query.searchPhone,
      searchCode: req.query.searchCode,
      searchHotelName: req.query.searchHotelName,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    })
  );

exports.getBookingsByOwner = (req, res) =>
  runService(res, () =>
    bookingApi.getBookingsByOwner({
      ownerId: req.user.id,
      hotelId: req.query.hotelId || null,
      query: {
        page: req.query.page,
        limit: req.query.limit,
        all: req.query.all,
        view: req.query.view,
        showPastBookings: req.query.showPastBookings,
        statusFilter: req.query.statusFilter,
        methodFilter: req.query.methodFilter,
        proofFilter: req.query.proofFilter,
        search: req.query.search,
      },
    })
  );

exports.getBookingById = (req, res) =>
  runService(res, () => bookingApi.getBookingByIdForUser({ id: req.params.id, user: req.user }));

exports.getAvailableRooms = (req, res) =>
  runService(res, () =>
    bookingApi.getAvailableRooms({
      hotelId: req.query.hotelId,
      checkInDate: req.query.checkInDate,
      checkOutDate: req.query.checkOutDate,
    })
  );

exports.updateBookingStatus = (req, res) =>
  runService(res, () =>
    bookingApi.updateBookingStatus({ id: req.params.id, status: req.body.status, user: req.user })
  );

exports.cancelBooking = (req, res) =>
  runService(res, () =>
    bookingApi.cancelBooking({ id: req.params.id, user: req.user, body: req.body })
  );

exports.confirmGuestRefund = (req, res) =>
  runService(res, () =>
    bookingApi.confirmGuestRefund({ id: req.params.id, user: req.user, file: req.file })
  );

exports.rejectQrPayment = (req, res) =>
  runService(res, () =>
    bookingApi.rejectQrPayment({
      id: req.params.id,
      user: req.user,
      rejectionType: req.body.rejectionType,
    })
  );

exports.checkIn = (req, res) =>
  runService(res, () => bookingApi.checkInWithNotification({ id: req.params.id, user: req.user }));

exports.checkOut = (req, res) =>
  runService(res, () =>
    bookingApi.checkOutWithNotification({
      id: req.params.id,
      user: req.user,
      lateCheckoutFeeAmount: req.body?.lateCheckoutFeeAmount,
      lateCheckoutFeeNote: req.body?.lateCheckoutFeeNote,
    })
  );

exports.getStaffBookings = (req, res) =>
  runService(res, () =>
    bookingApi.getStaffBookings({
      staffId: req.user.id,
      query: {
        page: req.query.page,
        limit: req.query.limit,
        all: req.query.all,
        view: req.query.view,
        showPastBookings: req.query.showPastBookings,
        statusFilter: req.query.statusFilter,
        methodFilter: req.query.methodFilter,
        proofFilter: req.query.proofFilter,
        search: req.query.search,
        actionSearch: req.query.actionSearch,
        actionType: req.query.actionType,
      },
    })
  );

exports.getStaffBookingById = (req, res) =>
  runService(res, () =>
    bookingApi.getStaffBookingByIdWithReview({ id: req.params.id, user: req.user })
  );

exports.staffCheckIn = (req, res) =>
  runService(res, () =>
    bookingApi.checkInWithNotification({ id: req.params.id, user: req.user, staff: true })
  );

exports.staffCheckOut = (req, res) =>
  runService(res, () =>
    bookingApi.checkOutWithNotification({
      id: req.params.id,
      user: req.user,
      staff: true,
      lateCheckoutFeeAmount: req.body?.lateCheckoutFeeAmount,
      lateCheckoutFeeNote: req.body?.lateCheckoutFeeNote,
    })
  );
