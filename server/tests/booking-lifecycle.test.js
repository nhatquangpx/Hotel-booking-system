const Booking = require("../models/Booking");
const { seedTestData } = require("./helpers/seed");
const { authedRequest } = require("./helpers/auth");
const {
  createGuestBooking,
  reportQrPayment,
  ownerConfirmPaid,
  createPaidQrBooking,
} = require("./helpers/scenarios");

describe("Booking Lifecycle — black box qua HTTP API", () => {
  let app;
  let data;

  beforeEach(async () => {
    app = global.getTestApp();
    data = await seedTestData();
  });

  it("Guest đặt → báo QR → Owner xác nhận paid → Check-in → Check-out → Review", async () => {
    const guest = await authedRequest(app, data.credentials.guest);
    const owner = await authedRequest(app, data.credentials.owner);
    const staff = await authedRequest(app, data.credentials.staff);

    const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 0, nights: 2 });

    const createRes = await createGuestBooking(guest, {
      hotelId: data.hotelId,
      roomId: data.roomIdDeluxe,
      checkInDate,
      checkOutDate,
      paymentMethod: "qr_code",
      specialRequests: "Phòng tầng cao",
    });
    expect(createRes.status).toBe(201);
    const bookingId = createRes.body._id;

    const qrRes = await reportQrPayment(guest, bookingId);
    expect(qrRes.status).toBe(200);

    const paidRes = await ownerConfirmPaid(owner, bookingId);
    expect(paidRes.status).toBe(200);
    expect(paidRes.body.booking.paymentStatus).toBe("paid");

    const checkInRes = await staff.post(`/api/staff/bookings/${bookingId}/check-in`);
    expect(checkInRes.status).toBe(200);
    expect(checkInRes.body.booking.checkedInAt).toBeDefined();

    const checkOutRes = await staff.post(`/api/staff/bookings/${bookingId}/check-out`);
    expect(checkOutRes.status).toBe(200);
    expect(checkOutRes.body.booking.checkedOutAt).toBeDefined();

    const reviewRes = await guest.put(`/api/guest/bookings/${bookingId}/review`).send({
      rating: 5,
      comment: "Phòng đẹp, dịch vụ tốt",
    });
    expect(reviewRes.status).toBe(201);

    const reviewLookup = await guest.get(`/api/guest/reviews/booking/${bookingId}`);
    expect(reviewLookup.status).toBe(200);
    const reviewId = reviewLookup.body._id;

    const replyRes = await owner.put(`/api/owner/reviews/${reviewId}/reply`).send({
      response: "Cảm ơn quý khách!",
    });
    expect(replyRes.status).toBe(200);
  });

  it("Guest hủy đơn pending — không cần STK hoàn tiền", async () => {
    const guest = await authedRequest(app, data.credentials.guest);
    const res = await guest
      .put(`/api/guest/bookings/${data.pendingBookingId}/cancel`)
      .send({ cancellationReason: "Thay đổi lịch trình" });
    expect(res.status).toBe(200);
    expect(res.body.booking.paymentStatus).toBe("cancelled");
  });

  it("Guest hủy đơn paid đủ điều kiện hoàn — cần STK ngân hàng", async () => {
    const guest = await authedRequest(app, data.credentials.guest);
    const owner = await authedRequest(app, data.credentials.owner);
    const bookingId = await createPaidQrBooking(guest, owner, data, {
      checkInOffset: 10,
      nights: 2,
      roomId: data.roomId,
    });

    const resWithoutBank = await guest
      .put(`/api/guest/bookings/${bookingId}/cancel`)
      .send({ cancellationReason: "Không đi được" });
    expect(resWithoutBank.status).toBe(400);

    const resWithBank = await guest.put(`/api/guest/bookings/${bookingId}/cancel`).send({
      cancellationReason: "Không đi được",
      refundBankAccountName: "Guest Test",
      refundBankAccountNumber: "1234567890",
      refundBankName: "Vietcombank",
    });
    expect(resWithBank.status).toBe(200);
    expect(resWithBank.body.booking.paymentStatus).toBe("cancelled");
  });

  it("Owner check-in trực tiếp (không qua staff)", async () => {
    const guest = await authedRequest(app, data.credentials.guest);
    const owner = await authedRequest(app, data.credentials.owner);
    const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 0, nights: 1 });

    const createRes = await createGuestBooking(guest, {
      hotelId: data.hotelId,
      roomId: data.roomId,
      checkInDate,
      checkOutDate,
    });
    const bookingId = createRes.body._id;
    await reportQrPayment(guest, bookingId);
    await ownerConfirmPaid(owner, bookingId);

    const checkInRes = await owner.post(`/api/owner/bookings/${bookingId}/check-in`);
    expect(checkInRes.status).toBe(200);

    const checkOutRes = await owner.post(`/api/owner/bookings/${bookingId}/check-out`);
    expect(checkOutRes.status).toBe(200);
  });

  it("Không đặt trùng phòng trong cùng khoảng ngày", async () => {
    const guest = await authedRequest(app, data.credentials.guest);
    const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 3, nights: 2 });

    const first = await createGuestBooking(guest, {
      hotelId: data.hotelId,
      roomId: data.roomId,
      checkInDate,
      checkOutDate,
    });
    expect(first.status).toBe(201);

    const second = await createGuestBooking(guest, {
      hotelId: data.hotelId,
      roomId: data.roomId,
      checkInDate,
      checkOutDate,
    });
    expect([400, 500]).toContain(second.status);
  });

  describe("Đặt phòng đồng thời", () => {
    it("hai guest đặt cùng phòng cùng ngày — chỉ một đơn thành công", async () => {
      const guest1 = await authedRequest(app, data.credentials.guest);
      const guest2 = await authedRequest(app, data.credentials.guest2);
      const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 20, nights: 2 });
      const payload = {
        hotel: data.hotelId,
        room: data.roomIdDeluxe,
        checkInDate,
        checkOutDate,
        paymentMethod: "qr_code",
      };

      const [res1, res2] = await Promise.all([
        guest1.post("/api/guest/bookings").send(payload),
        guest2.post("/api/guest/bookings").send(payload),
      ]);

      const successCount = [res1, res2].filter((r) => r.status === 201).length;
      const rejectedCount = [res1, res2].filter((r) => r.status === 400).length;
      expect(successCount).toBe(1);
      expect(rejectedCount).toBe(1);

      const overlapCount = await Booking.countDocuments({
        room: data.roomIdDeluxe,
        paymentStatus: { $in: ["pending", "paid"] },
        checkInDate: { $lt: new Date(checkOutDate) },
        checkOutDate: { $gt: new Date(checkInDate) },
      });
      expect(overlapCount).toBe(1);
    });

    it("mười request đồng thời cùng phòng — đúng một đơn thành công", async () => {
      const guestAgents = await Promise.all(
        Array.from({ length: 10 }, (_, i) =>
          authedRequest(app, i % 2 === 0 ? data.credentials.guest : data.credentials.guest2)
        )
      );

      const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 25, nights: 2 });
      const payload = {
        hotel: data.hotelId,
        room: data.roomId,
        checkInDate,
        checkOutDate,
        paymentMethod: "qr_code",
      };

      const results = await Promise.all(
        guestAgents.map((agent) => agent.post("/api/guest/bookings").send(payload))
      );

      const successCount = results.filter((r) => r.status === 201).length;
      const rejectedCount = results.filter((r) => r.status === 400).length;
      expect(successCount).toBe(1);
      expect(rejectedCount).toBe(9);

      const overlapCount = await Booking.countDocuments({
        room: data.roomId,
        paymentStatus: { $in: ["pending", "paid"] },
        checkInDate: { $lt: new Date(checkOutDate) },
        checkOutDate: { $gt: new Date(checkInDate) },
      });
      expect(overlapCount).toBe(1);
    });

    it("đặt đồng thời lịch chồng một phần — vẫn chỉ một đơn", async () => {
      const guest1 = await authedRequest(app, data.credentials.guest);
      const guest2 = await authedRequest(app, data.credentials.guest2);
      const base = data.futureStayDates({ checkInOffset: 30, nights: 3 });
      const overlap = data.futureStayDates({ checkInOffset: 31, nights: 3 });

      const [res1, res2] = await Promise.all([
        createGuestBooking(guest1, {
          hotelId: data.hotelId,
          roomId: data.roomIdDeluxe,
          checkInDate: base.checkInDate,
          checkOutDate: base.checkOutDate,
        }),
        createGuestBooking(guest2, {
          hotelId: data.hotelId,
          roomId: data.roomIdDeluxe,
          checkInDate: overlap.checkInDate,
          checkOutDate: overlap.checkOutDate,
        }),
      ]);

      const successCount = [res1, res2].filter((r) => r.status === 201).length;
      const rejectedCount = [res1, res2].filter((r) => r.status === 400).length;
      expect(successCount).toBe(1);
      expect(rejectedCount).toBe(1);

      const overlapCount = await Booking.countDocuments({
        room: data.roomIdDeluxe,
        paymentStatus: { $in: ["pending", "paid"] },
        $or: [
          {
            checkInDate: { $lt: new Date(base.checkOutDate) },
            checkOutDate: { $gt: new Date(base.checkInDate) },
          },
          {
            checkInDate: { $lt: new Date(overlap.checkOutDate) },
            checkOutDate: { $gt: new Date(overlap.checkInDate) },
          },
        ],
      });
      expect(overlapCount).toBe(1);
    });
  });

  describe("Hết hạn giữ phòng pending", () => {
    const {
      cancelExpiredPendingBookings,
      SYSTEM_CANCEL_REASON,
    } = require("../services/bookings/pendingExpiry");

    it("cron logic hủy đơn pending quá hạn — giải phóng phòng", async () => {
      const guest = await authedRequest(app, data.credentials.guest);
      const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 40, nights: 2 });

      const createRes = await createGuestBooking(guest, {
        hotelId: data.hotelId,
        roomId: data.roomIdDeluxe,
        checkInDate,
        checkOutDate,
      });
      expect(createRes.status).toBe(201);
      const bookingId = createRes.body._id;

      await Booking.findByIdAndUpdate(bookingId, {
        pendingExpiresAt: new Date(Date.now() - 60_000),
      });

      const result = await cancelExpiredPendingBookings();
      expect(result.cancelled).toBeGreaterThanOrEqual(1);

      const booking = await Booking.findById(bookingId);
      expect(booking.paymentStatus).toBe("cancelled");
      expect(booking.cancellationReason).toBe(SYSTEM_CANCEL_REASON);

      const retry = await createGuestBooking(guest, {
        hotelId: data.hotelId,
        roomId: data.roomIdDeluxe,
        checkInDate,
        checkOutDate,
      });
      expect(retry.status).toBe(201);
    });

    it("không hủy đơn pending quá hạn nếu đã gửi minh chứng QR chờ duyệt", async () => {
      const guest = await authedRequest(app, data.credentials.guest);
      const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 42, nights: 2 });

      const createRes = await createGuestBooking(guest, {
        hotelId: data.hotelId,
        roomId: data.roomId,
        checkInDate,
        checkOutDate,
      });
      expect(createRes.status).toBe(201);
      const bookingId = createRes.body._id;

      await Booking.findByIdAndUpdate(bookingId, {
        pendingExpiresAt: new Date(Date.now() - 60_000),
        qrPaymentReportedAt: new Date(),
      });

      await cancelExpiredPendingBookings();

      const booking = await Booking.findById(bookingId);
      expect(booking.paymentStatus).toBe("pending");
    });

    it("đơn pending quá hạn chưa cron vẫn không chặn đặt phòng mới", async () => {
      const { checkRoomAvailability } = require("../services/bookings/core");
      const guest = await authedRequest(app, data.credentials.guest);
      const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 46, nights: 2 });

      const createRes = await createGuestBooking(guest, {
        hotelId: data.hotelId,
        roomId: data.roomIdDeluxe,
        checkInDate,
        checkOutDate,
      });
      expect(createRes.status).toBe(201);
      const bookingId = createRes.body._id;

      await Booking.findByIdAndUpdate(bookingId, {
        pendingExpiresAt: new Date(Date.now() - 60_000),
      });

      const availableBeforeCron = await checkRoomAvailability(
        data.roomIdDeluxe,
        checkInDate,
        checkOutDate
      );
      expect(availableBeforeCron).toBe(true);

      const stale = await Booking.findById(bookingId);
      expect(stale.paymentStatus).toBe("pending");

      const retry = await createGuestBooking(guest, {
        hotelId: data.hotelId,
        roomId: data.roomIdDeluxe,
        checkInDate,
        checkOutDate,
      });
      expect(retry.status).toBe(201);
      expect(retry.body._id).not.toBe(bookingId);

      const expired = await Booking.findById(bookingId);
      expect(expired.paymentStatus).toBe("cancelled");
    });

    it("hủy đơn pending quá hạn kể cả đã khởi tạo VNPay", async () => {
      const guest = await authedRequest(app, data.credentials.guest);
      const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 44, nights: 2 });

      const createRes = await createGuestBooking(guest, {
        hotelId: data.hotelId,
        roomId: data.roomId,
        checkInDate,
        checkOutDate,
        paymentMethod: "vnpay",
      });
      expect(createRes.status).toBe(201);
      const bookingId = createRes.body._id;

      await Booking.findByIdAndUpdate(bookingId, {
        pendingExpiresAt: new Date(Date.now() - 60_000),
        vnpTransactionRef: "VNP-TEST-REF",
      });

      await cancelExpiredPendingBookings();

      const booking = await Booking.findById(bookingId);
      expect(booking.paymentStatus).toBe("cancelled");
      expect(booking.cancellationReason).toBe(SYSTEM_CANCEL_REASON);
    });
  });

  it("Sale giảm giá được áp dụng khi preview giá", async () => {
    const guest = await authedRequest(app, data.credentials.guest);
    const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 2, nights: 2 });

    const res = await guest.get("/api/guest/bookings/price-preview").query({
      hotelId: data.hotelId,
      roomId: data.roomId,
      checkInDate,
      checkOutDate,
    });
    expect(res.status).toBe(200);
    expect(res.body.discountAmount).toBeGreaterThanOrEqual(0);
    if (res.body.discountAmount > 0) {
      expect(res.body.finalAmount).toBeLessThan(res.body.basePrice);
    }
  });
});
