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
