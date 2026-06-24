const { seedTestData } = require("./helpers/seed");
const { authedRequest } = require("./helpers/auth");
const { reportQrPayment, createPaidQrBooking } = require("./helpers/scenarios");

describe("Owner — chủ khách sạn", () => {
  let app;
  let data;
  let owner;

  beforeEach(async () => {
    app = global.getTestApp();
    data = await seedTestData();
    owner = await authedRequest(app, data.credentials.owner);
  });

  describe("Profile & Hotel", () => {
    it("GET /profile", async () => {
      const res = await owner.get("/api/owner/profile");
      expect(res.status).toBe(200);
    });

    it("GET /hotels — chỉ KS của owner", async () => {
      const res = await owner.get("/api/owner/hotels");
      expect(res.status).toBe(200);
      expect(res.body.some((h) => h.name === data.hotelName)).toBe(true);
    });

    it("GET /hotels/:id", async () => {
      const res = await owner.get(`/api/owner/hotels/${data.hotelId}`);
      expect(res.status).toBe(200);
    });

    it("PUT /hotels/:id — cập nhật KS", async () => {
      const res = await owner
        .put(`/api/owner/hotels/${data.hotelId}`)
        .field("description", "Mô tả owner cập nhật");
      expect(res.status).toBe(200);
    });

    it("GET /hotels/:hotelId/maintenance-contact", async () => {
      const res = await owner.get(`/api/owner/hotels/${data.hotelId}/maintenance-contact`);
      expect(res.status).toBe(200);
    });

    it("PUT /hotels/:hotelId/maintenance-contact", async () => {
      const res = await owner
        .put(`/api/owner/hotels/${data.hotelId}/maintenance-contact`)
        .send({ maintenanceContactEmail: "repair@test.com" });
      expect(res.status).toBe(200);
    });
  });

  describe("Rooms", () => {
    it("GET /hotels/:hotelId/rooms", async () => {
      const res = await owner.get(`/api/owner/hotels/${data.hotelId}/rooms`);
      expect(res.status).toBe(200);
    });

    it("POST /hotels/:hotelId/rooms — tạo phòng", async () => {
      const res = await owner
        .post(`/api/owner/hotels/${data.hotelId}/rooms`)
        .field("roomNumber", "301")
        .field("type", "family")
        .field("description", "Phòng family owner tạo")
        .field("price", "900000")
        .field("maxPeople", "5");
      expect(res.status).toBe(201);
    });

    it("GET /rooms/:id/bookings", async () => {
      const res = await owner.get(`/api/owner/rooms/${data.roomId}/bookings`);
      expect(res.status).toBe(200);
    });

    it("GET /hotels/:hotelId/room-equipment", async () => {
      const res = await owner.get(`/api/owner/hotels/${data.hotelId}/room-equipment`);
      expect(res.status).toBe(200);
    });

    it("POST /rooms/:roomId/equipment", async () => {
      const res = await owner
        .post(`/api/owner/rooms/${data.roomId}/equipment`)
        .send({ name: "Điều hòa" });
      expect(res.status).toBe(201);
    });
  });

  describe("Bookings", () => {
    it("GET /bookings", async () => {
      const res = await owner.get("/api/owner/bookings");
      expect(res.status).toBe(200);
    });

    it("GET /bookings/:id", async () => {
      const res = await owner.get(`/api/owner/bookings/${data.pendingBookingId}`);
      expect(res.status).toBe(200);
    });

    it("PUT /bookings/:id/status — không xác nhận paid khi chưa có proof QR", async () => {
      const res = await owner
        .put(`/api/owner/bookings/${data.pendingBookingId}/status`)
        .send({ status: "paid" });
      expect([400, 500]).toContain(res.status);
    });

    it("PUT /bookings/:id/status — không hủy đơn đã paid", async () => {
      const guestClient = await authedRequest(app, data.credentials.guest);
      const bookingId = await createPaidQrBooking(guestClient, owner, data, {
        checkInOffset: 8,
        nights: 2,
        roomId: data.roomIdDeluxe,
      });
      const res = await owner
        .put(`/api/owner/bookings/${bookingId}/status`)
        .send({ status: "cancelled" });
      expect([400, 500]).toContain(res.status);
    });

    it("POST /bookings/:id/reject-qr-payment", async () => {
      const guestClient = await authedRequest(app, data.credentials.guest);
      await reportQrPayment(guestClient, data.pendingBookingId);
      const res = await owner
        .post(`/api/owner/bookings/${data.pendingBookingId}/reject-qr-payment`)
        .send({ rejectionType: "invalid_proof" });
      expect(res.status).toBe(200);
    });
  });

  describe("Reviews", () => {
    it("GET /reviews", async () => {
      const res = await owner.get("/api/owner/reviews").query({ hotelId: data.hotelId });
      expect(res.status).toBe(200);
    });
  });

  describe("Sales", () => {
    it("GET /sales", async () => {
      const res = await owner.get("/api/owner/sales").query({ hotelId: data.hotelId });
      expect(res.status).toBe(200);
    });

    it("POST /sales — tạo sale", async () => {
      const res = await owner.post("/api/owner/sales").send({
        hotelId: data.hotelId,
        title: "Sale mới",
        scope: "room_type",
        roomType: "deluxe",
        startDate: data.toIsoDate(data.addDays(new Date(), 1)),
        endDate: data.toIsoDate(data.addDays(new Date(), 15)),
        discountPercent: 15,
      });
      expect(res.status).toBe(201);
    });

    it("PATCH /sales/:id/status", async () => {
      const res = await owner
        .patch(`/api/owner/sales/${data.saleId}/status`)
        .send({ isActive: false });
      expect(res.status).toBe(200);
    });

    it("POST /sales/sync-expired", async () => {
      const res = await owner.post("/api/owner/sales/sync-expired").query({ hotelId: data.hotelId });
      expect(res.status).toBe(200);
    });
  });

  describe("Dynamic pricing", () => {
    it("GET /pricing/dynamic", async () => {
      const res = await owner.get("/api/owner/pricing/dynamic").query({ hotelId: data.hotelId });
      expect(res.status).toBe(200);
    });
  });

  describe("Dashboard", () => {
    it("GET /dashboard/stats", async () => {
      const res = await owner.get("/api/owner/dashboard/stats");
      expect(res.status).toBe(200);
    });

    it("GET /dashboard/revenue", async () => {
      const res = await owner.get("/api/owner/dashboard/revenue");
      expect(res.status).toBe(200);
    });

    it("GET /dashboard/rooms", async () => {
      const res = await owner.get("/api/owner/dashboard/rooms");
      expect(res.status).toBe(200);
    });

    it("GET /dashboard/tasks", async () => {
      const res = await owner.get("/api/owner/dashboard/tasks");
      expect(res.status).toBe(200);
    });
  });

  describe("Notifications & Reports", () => {
    it("GET /notifications", async () => {
      const res = await owner.get("/api/owner/notifications");
      expect(res.status).toBe(200);
    });

    it("POST /notifications/check-no-show", async () => {
      const res = await owner.post("/api/owner/notifications/check-no-show");
      expect(res.status).toBe(200);
    });

    it("GET /reports/export", async () => {
      const from = data.toIsoDate(data.addDays(new Date(), -30));
      const to = data.toIsoDate(new Date());
      const res = await owner
        .get("/api/owner/reports/export")
        .query({ from, to, hotelId: data.hotelId });
      expect(res.status).toBe(200);
    });
  });

  describe("Isolation — owner khác không truy cập KS", () => {
    it("other owner không xem booking của KS khác", async () => {
      const otherOwner = await authedRequest(app, data.credentials.otherOwner);
      const res = await otherOwner.get(`/api/owner/bookings/${data.pendingBookingId}`);
      expect([403, 404, 500]).toContain(res.status);
    });
  });
});
