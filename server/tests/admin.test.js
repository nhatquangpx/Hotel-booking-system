const { seedTestData } = require("./helpers/seed");
const { authedRequest } = require("./helpers/auth");

describe("Admin — quản trị hệ thống", () => {
  let app;
  let data;
  let admin;

  beforeEach(async () => {
    app = global.getTestApp();
    data = await seedTestData();
    admin = await authedRequest(app, data.credentials.admin);
  });

  describe("Profile", () => {
    it("GET /profile", async () => {
      const res = await admin.get("/api/admin/profile");
      expect(res.status).toBe(200);
    });

    it("PUT /profile", async () => {
      const res = await admin.put("/api/admin/profile").send({ name: "Admin Updated" });
      expect(res.status).toBe(200);
    });
  });

  describe("User management", () => {
    it("GET /users — danh sách", async () => {
      const res = await admin.get("/api/admin/users");
      expect(res.status).toBe(200);
      const users = Array.isArray(res.body) ? res.body : res.body.users;
      expect(users.length).toBeGreaterThan(0);
    });

    it("GET /users/:id", async () => {
      const res = await admin.get(`/api/admin/users/${data.userIds.guest}`);
      expect(res.status).toBe(200);
    });

    it("POST /users — tạo guest mới", async () => {
      const res = await admin.post("/api/admin/users").send({
        name: "Created Guest",
        email: "created@test.com",
        password: "123456",
        phone: "0911111111",
        role: "guest",
      });
      expect(res.status).toBe(201);
    });

    it("POST /users — tạo staff cần assignedHotelId", async () => {
      const res = await admin.post("/api/admin/users").send({
        name: "New Staff",
        email: "newstaff@test.com",
        password: "123456",
        phone: "0922222222",
        role: "staff",
        assignedHotelId: data.hotelId,
      });
      expect(res.status).toBe(201);
    });

    it("PUT /users/:id — cập nhật", async () => {
      const res = await admin
        .put(`/api/admin/users/${data.userIds.guest}`)
        .send({ name: "Guest By Admin" });
      expect(res.status).toBe(200);
    });

    it("DELETE /users/:id", async () => {
      const createRes = await admin.post("/api/admin/users").send({
        name: "To Delete",
        email: "todelete@test.com",
        password: "123456",
        phone: "0933333333",
        role: "guest",
      });
      const res = await admin.delete(`/api/admin/users/${createRes.body.user._id}`);
      expect(res.status).toBe(200);
    });
  });

  describe("Hotel management", () => {
    it("GET /hotels", async () => {
      const res = await admin.get("/api/admin/hotels");
      expect(res.status).toBe(200);
    });

    it("GET /hotels/:id", async () => {
      const res = await admin.get(`/api/admin/hotels/${data.hotelId}`);
      expect(res.status).toBe(200);
    });

    it("GET /hotels/owners/list", async () => {
      const res = await admin.get("/api/admin/hotels/owners/list");
      expect(res.status).toBe(200);
    });

    it("POST /hotels — tạo KS mới", async () => {
      const res = await admin
        .post("/api/admin/hotels")
        .field("name", "KS Admin Tạo")
        .field("ownerId", data.userIds.owner)
        .field("description", "Mô tả KS admin tạo")
        .field("starRating", "4")
        .field("status", "active")
        .field("address[number]", "50")
        .field("address[street]", "Admin Street")
        .field("address[city]", "TP.HCM")
        .field("contactInfo[phone]", "0281234567")
        .field("contactInfo[email]", "adminhotel@test.com");
      expect([201, 400]).toContain(res.status);
    });

    it("PUT /hotels/:id", async () => {
      const res = await admin
        .put(`/api/admin/hotels/${data.hotelId}`)
        .field("description", "Mô tả cập nhật bởi admin");
      expect(res.status).toBe(200);
    });
  });

  describe("Room management", () => {
    it("GET /rooms/hotel/:hotelId", async () => {
      const res = await admin.get(`/api/admin/rooms/hotel/${data.hotelId}`);
      expect(res.status).toBe(200);
    });

    it("GET /rooms/:id", async () => {
      const res = await admin.get(`/api/admin/rooms/${data.roomId}`);
      expect(res.status).toBe(200);
    });

    it("POST /rooms — tạo phòng", async () => {
      const res = await admin
        .post("/api/admin/rooms")
        .field("hotelId", data.hotelId)
        .field("roomNumber", "201")
        .field("type", "suite")
        .field("description", "Phòng suite admin tạo")
        .field("price", "1200000")
        .field("maxPeople", "4");
      expect(res.status).toBe(201);
    });

    it("PUT /rooms/:id", async () => {
      const res = await admin.put(`/api/admin/rooms/${data.roomId}`).field("price", "550000");
      expect(res.status).toBe(200);
    });
  });

  describe("Bookings", () => {
    it("GET /bookings", async () => {
      const res = await admin.get("/api/admin/bookings");
      expect(res.status).toBe(200);
    });

    it("GET /bookings/:id", async () => {
      const res = await admin.get(`/api/admin/bookings/${data.pendingBookingId}`);
      expect(res.status).toBe(200);
    });

    it("GET /bookings/user/:userId", async () => {
      const res = await admin.get(`/api/admin/bookings/user/${data.userIds.guest}`);
      expect(res.status).toBe(200);
    });
  });

  describe("Dashboard", () => {
    it("GET /dashboard/stats", async () => {
      const res = await admin.get("/api/admin/dashboard/stats");
      expect(res.status).toBe(200);
    });

    it("GET /dashboard/recent-activities", async () => {
      const res = await admin.get("/api/admin/dashboard/recent-activities");
      expect(res.status).toBe(200);
    });

    it("GET /dashboard/revenue-by-hotel", async () => {
      const res = await admin.get("/api/admin/dashboard/revenue-by-hotel");
      expect(res.status).toBe(200);
    });

    it("GET /dashboard/pending-contacts", async () => {
      const res = await admin.get("/api/admin/dashboard/pending-contacts");
      expect(res.status).toBe(200);
    });
  });

  describe("Contact messages", () => {
    it("GET /contact-messages", async () => {
      const res = await admin.get("/api/admin/contact-messages");
      expect(res.status).toBe(200);
    });

    it("PUT /contact-messages/:id/read", async () => {
      const res = await admin.put(`/api/admin/contact-messages/${data.contactMessageId}/read`);
      expect(res.status).toBe(200);
    });

    it("POST /contact-messages/:id/reply", async () => {
      const res = await admin
        .post(`/api/admin/contact-messages/${data.contactMessageId}/reply`)
        .send({ replyMessage: "Cảm ơn bạn đã liên hệ" });
      expect(res.status).toBe(200);
    });
  });

  describe("Notifications", () => {
    it("GET /notifications", async () => {
      const res = await admin.get("/api/admin/notifications");
      expect(res.status).toBe(200);
    });
  });

  describe("Reports", () => {
    it("GET /reports/export", async () => {
      const from = data.toIsoDate(data.addDays(new Date(), -30));
      const to = data.toIsoDate(new Date());
      const res = await admin.get("/api/admin/reports/export").query({ from, to });
      expect(res.status).toBe(200);
    });
  });
});
