const request = require("supertest");
const { seedTestData } = require("./helpers/seed");
const { authedRequest } = require("./helpers/auth");
const { attachPaymentProof } = require("./helpers/upload");
const { createGuestBooking, createPaidQrBooking } = require("./helpers/scenarios");

describe("Payment — thanh toán guest (black box)", () => {
  let app;
  let data;

  beforeEach(async () => {
    app = global.getTestApp();
    data = await seedTestData();
  });

  describe("GET /transactions", () => {
    it("danh sách giao dịch của guest", async () => {
      const guest = await authedRequest(app, data.credentials.guest);
      const res = await guest.get("/api/payment/transactions");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /vnpay/create-payment-url", () => {
    it("tạo URL VNPay cho booking pending", async () => {
      const guest = await authedRequest(app, data.credentials.guest);
      const dates = data.futureStayDates({ checkInOffset: 7, nights: 2 });
      const createRes = await createGuestBooking(guest, {
        hotelId: data.hotelId,
        roomId: data.roomIdDeluxe,
        checkInDate: dates.checkInDate,
        checkOutDate: dates.checkOutDate,
        paymentMethod: "vnpay",
      });
      expect(createRes.status).toBe(201);

      const res = await guest
        .post("/api/payment/vnpay/create-payment-url")
        .send({ bookingId: createRes.body._id });
      expect(res.status).toBe(200);
      expect(res.body.paymentUrl || res.body.url).toBeDefined();
    });

    it("từ chối thanh toán booking của guest khác", async () => {
      const guest2 = await authedRequest(app, data.credentials.guest2);
      const res = await guest2
        .post("/api/payment/vnpay/create-payment-url")
        .send({ bookingId: data.pendingBookingId });
      expect(res.status).toBe(403);
    });

    it("từ chối thanh toán booking đã paid", async () => {
      const guest = await authedRequest(app, data.credentials.guest);
      const owner = await authedRequest(app, data.credentials.owner);
      const bookingId = await createPaidQrBooking(guest, owner, data, {
        checkInOffset: 12,
        nights: 2,
        roomId: data.roomIdDeluxe,
      });

      const res = await guest
        .post("/api/payment/vnpay/create-payment-url")
        .send({ bookingId });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /qr/confirm-payment", () => {
    it("guest báo đã chuyển khoản QR", async () => {
      const guest = await authedRequest(app, data.credentials.guest);
      const req = guest
        .post("/api/payment/qr/confirm-payment")
        .field("bookingId", data.pendingBookingId);
      const res = await attachPaymentProof(req);
      expect(res.status).toBe(200);
    });
  });

  describe("GET /vnpay-return", () => {
    it("callback VNPay public endpoint", async () => {
      const res = await request(app).get("/api/payment/vnpay-return").query({
        vnp_Amount: "100000000",
        vnp_ResponseCode: "24",
      });
      expect([200, 302, 400]).toContain(res.status);
    });
  });
});
