const bookingApi = require("../services/bookings/bookingApiService");
const { runService } = require("../lib/http/controllerHelper");

exports.createBooking = (req, res) =>
  runService(res, () =>
    bookingApi.bookingService
      .createGuestBooking(
        {
          hotelId: req.body.hotelId ?? req.body.hotel,
          roomId: req.body.roomId ?? req.body.room,
          checkInDate: req.body.checkInDate,
          checkOutDate: req.body.checkOutDate,
          paymentMethod: req.body.paymentMethod,
          specialRequests: req.body.specialRequests,
        },
        req.user.id
      )
      .then((body) => ({ status: 201, body }))
  );

exports.getPricePreview = (req, res) =>
  runService(res, async () => {
    const { hotelId, roomId, checkInDate, checkOutDate } = req.query;
    if (!hotelId || !roomId || !checkInDate || !checkOutDate) {
      const { ServiceError } = require("../lib/http/serviceError");
      throw new ServiceError(400, "Thiếu hotelId, roomId, checkInDate hoặc checkOutDate");
    }
    const body = await bookingApi.bookingService.previewBookingPrice(
      hotelId,
      roomId,
      checkInDate,
      checkOutDate
    );
    return { status: 200, body };
  });

exports.getMyBookings = (req, res) =>
  runService(res, () =>
    bookingApi.bookingService.getMyBookings(req.user.id).then((body) => ({ status: 200, body }))
  );

exports.getUserBookings = (req, res) =>
  runService(res, () =>
    bookingApi.bookingService
      .getUserBookings(req.params.userId)
      .then((body) => ({ status: 200, body }))
  );

exports.getAllBookings = (req, res) =>
  runService(res, () =>
    bookingApi.bookingService.getAllBookings().then((body) => ({ status: 200, body }))
  );

exports.getBookingsByOwner = (req, res) =>
  runService(res, () =>
    bookingApi.bookingService
      .getBookingsByOwner(req.user.id, req.query.hotelId || null)
      .then((body) => ({ status: 200, body }))
  );

exports.getBookingById = (req, res) =>
  runService(res, () => bookingApi.getBookingByIdForUser({ id: req.params.id, user: req.user }));

exports.getAvailableRooms = (req, res) =>
  runService(res, async () => {
    const { hotelId, checkInDate, checkOutDate } = req.query;
    if (!hotelId || !checkInDate || !checkOutDate) {
      const { ServiceError } = require("../lib/http/serviceError");
      throw new ServiceError(400, "Vui lòng cung cấp đầy đủ hotelId, checkInDate và checkOutDate");
    }
    const body = await bookingApi.bookingService.getAvailableRooms(
      hotelId,
      checkInDate,
      checkOutDate
    );
    return { status: 200, body };
  });

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
    bookingApi.bookingService
      .confirmOwnerGuestRefund(req.params.id, req.user, req.file)
      .then((booking) => ({
        status: 200,
        body: { message: "Đã xác nhận hoàn tiền cho khách", booking },
      }))
  );

exports.rejectQrPayment = (req, res) =>
  runService(res, async () => {
    const booking = await bookingApi.bookingService.rejectOwnerQrPayment(
      req.params.id,
      req.user,
      req.body.rejectionType
    );
    const isResubmit =
      booking.ownerQrRejectionType === "invalid_proof" && booking.paymentStatus === "pending";
    return {
      status: 200,
      body: {
        message: isResubmit
          ? "Đã yêu cầu khách tải lại minh chứng và thông báo cho khách"
          : "Đã hủy đơn đặt phòng và thông báo cho khách",
        booking,
      },
    };
  });

exports.checkIn = (req, res) =>
  runService(res, () => bookingApi.checkInWithNotification({ id: req.params.id, user: req.user }));

exports.checkOut = (req, res) =>
  runService(res, () => bookingApi.checkOutWithNotification({ id: req.params.id, user: req.user }));

exports.getStaffBookings = (req, res) =>
  runService(res, () =>
    bookingApi.bookingService.getBookingsByStaff(req.user.id).then((body) => ({ status: 200, body }))
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
    bookingApi.checkOutWithNotification({ id: req.params.id, user: req.user, staff: true })
  );
