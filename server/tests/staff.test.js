const request = require("supertest");
const { seedTestData } = require("./helpers/seed");
const { authedRequest } = require("./helpers/auth");
const { createPaidQrBooking } = require("./helpers/scenarios");

describe("Staff — nhân viên khách sạn (black box)", () => {
  let app;
  let data;

  beforeEach(async () => {
    app = global.getTestApp();
    data = await seedTestData();
  });

  describe("Profile", () => {
    it("GET /profile", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get("/api/staff/profile");
      expect(res.status).toBe(200);
    });

    it("PUT /profile", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.put("/api/staff/profile").send({ name: "Staff Updated" });
      expect(res.status).toBe(200);
    });
  });

  describe("Staff chưa gán KS — login bị chặn", () => {
    it("login staff không có hotel → 403", async () => {
      const res = await request(app).post("/api/auth/login").send({
        email: data.credentials.unassignedStaff.email,
        password: data.password,
      });
      expect(res.status).toBe(403);
    });
  });

  describe("Dashboard", () => {
    it("GET /dashboard", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get("/api/staff/dashboard");
      expect(res.status).toBe(200);
    });
  });

  describe("Bookings", () => {
    it("GET /bookings", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get("/api/staff/bookings");
      expect(res.status).toBe(200);
    });

    it("GET /bookings/:id", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get(`/api/staff/bookings/${data.pendingBookingId}`);
      expect(res.status).toBe(200);
    });

    it("POST /bookings/:id/check-in — từ chối khi chưa paid", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.post(`/api/staff/bookings/${data.pendingBookingId}/check-in`);
      expect(res.status).toBe(400);
    });

    it("POST /bookings/:id/check-in — thành công khi paid", async () => {
      const guest = await authedRequest(app, data.credentials.guest);
      const owner = await authedRequest(app, data.credentials.owner);
      const staff = await authedRequest(app, data.credentials.staff);
      const bookingId = await createPaidQrBooking(guest, owner, data, {
        checkInOffset: 0,
        nights: 2,
        roomId: data.roomIdDeluxe,
      });
      const res = await staff.post(`/api/staff/bookings/${bookingId}/check-in`);
      expect(res.status).toBe(200);
      expect(res.body.booking.checkedInAt).toBeDefined();
    });
  });

  describe("Rooms", () => {
    it("GET /rooms", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get("/api/staff/rooms");
      expect(res.status).toBe(200);
    });

    it("GET /rooms/:id", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get(`/api/staff/rooms/${data.roomId}`);
      expect(res.status).toBe(200);
    });

    it("PATCH /rooms/:id/room-status", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff
        .patch(`/api/staff/rooms/${data.roomId}/room-status`)
        .send({ roomStatus: "maintenance" });
      expect(res.status).toBe(200);
    });
  });

  describe("Equipment", () => {
    it("GET /room-equipment", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get("/api/staff/room-equipment");
      expect(res.status).toBe(200);
    });

    it("POST /rooms/:roomId/equipment", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff
        .post(`/api/staff/rooms/${data.roomId}/equipment`)
        .send({ name: "Tủ lạnh" });
      expect(res.status).toBe(201);
    });

    it("POST /equipment-repair-request", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const equipmentRes = await staff
        .post(`/api/staff/rooms/${data.roomId}/equipment`)
        .send({ name: "Máy sấy" });
      expect(equipmentRes.status).toBe(201);
      const equipmentList = equipmentRes.body.roomEquipment || [];
      const equipmentId = equipmentList[equipmentList.length - 1]?._id;
      expect(equipmentId).toBeDefined();

      await staff
        .patch(`/api/staff/rooms/${data.roomId}/equipment/${equipmentId}`)
        .send({ status: "broken" });

      const res = await staff.post("/api/staff/equipment-repair-request").send({
        items: [{ roomId: data.roomId, equipmentId: String(equipmentId) }],
      });
      expect(res.status).toBe(200);
    });
  });

  describe("Reviews", () => {
    it("GET /reviews", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get("/api/staff/reviews");
      expect(res.status).toBe(200);
    });
  });

  describe("Maintenance contact", () => {
    it("GET /hotel/maintenance-contact", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get("/api/staff/hotel/maintenance-contact");
      expect(res.status).toBe(200);
    });
  });

  describe("Notifications", () => {
    it("GET /notifications", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get("/api/staff/notifications");
      expect(res.status).toBe(200);
    });

    it("GET /notifications/unread-count", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get("/api/staff/notifications/unread-count");
      expect(res.status).toBe(200);
    });
  });

  describe("Staff không có quyền owner", () => {
    it("staff không truy cập /api/owner/sales", async () => {
      const staff = await authedRequest(app, data.credentials.staff);
      const res = await staff.get("/api/owner/sales").query({ hotelId: data.hotelId });
      expect(res.status).toBe(403);
    });
  });
});
