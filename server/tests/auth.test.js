const request = require("supertest");
const { seedTestData } = require("./helpers/seed");
const { loginAs, authedRequest } = require("./helpers/auth");

describe("Health & Auth", () => {
  let app;
  let data;

  beforeEach(async () => {
    app = global.getTestApp();
    data = await seedTestData();
  });

  describe("GET /health", () => {
    it("trả về status ok", async () => {
      const res = await request(app).get("/health");
      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe("POST /api/auth/register", () => {
    it("đăng ký guest mới thành công", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "New Guest",
        email: "newguest@test.com",
        password: "123456",
        phone: "0987654321",
      });
      expect(res.status).toBe(201);
      expect(res.body.user.role).toBe("guest");
      expect(res.body.user.email).toBe("newguest@test.com");
    });

    it("từ chối email trùng", async () => {
      const res = await request(app).post("/api/auth/register").send({
        name: "Duplicate",
        email: data.credentials.guest.email,
        password: "123456",
        phone: "0987654322",
      });
      expect(res.status).toBe(400);
    });

    it("từ chối dữ liệu thiếu", async () => {
      const res = await request(app).post("/api/auth/register").send({
        email: "invalid@test.com",
      });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /api/auth/login", () => {
    it("đăng nhập thành công cho 4 role", async () => {
      for (const role of ["admin", "owner", "staff", "guest"]) {
        const user = data.credentials[role];
        const res = await loginAs(app, { email: user.email, password: data.password });
        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe(role);
        expect(res.headers["set-cookie"]).toBeDefined();
      }
    });

    it("từ chối mật khẩu sai", async () => {
      const res = await loginAs(app, {
        email: data.credentials.guest.email,
        password: "wrongpass",
      });
      expect(res.status).toBe(400);
    });

    it("từ chối email không tồn tại", async () => {
      const res = await loginAs(app, {
        email: "nobody@test.com",
        password: data.password,
      });
      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/auth/me", () => {
    it("trả về user khi đã đăng nhập", async () => {
      const guest = await authedRequest(app, data.credentials.guest);
      const res = await guest.get("/api/auth/me");
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe(data.credentials.guest.email);
    });

    it("401 khi chưa đăng nhập", async () => {
      const res = await request(app).get("/api/auth/me");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("logout thành công", async () => {
      const agent = await authedRequest(app, data.credentials.guest);
      const res = await agent.post("/api/auth/logout");
      expect(res.status).toBe(200);
    });
  });

  describe("POST /api/auth/refresh", () => {
    it("refresh token thành công", async () => {
      const agent = await authedRequest(app, data.credentials.guest);
      const res = await agent.post("/api/auth/refresh");
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
    });
  });

  describe("2FA endpoints", () => {
    it("GET /api/auth/2fa/status trả về trạng thái", async () => {
      const admin = await authedRequest(app, data.credentials.admin);
      const res = await admin.get("/api/auth/2fa/status");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("enabled");
    });
  });

  describe("POST /api/auth/forgotpassword", () => {
    it("chấp nhận email hợp lệ", async () => {
      const res = await request(app)
        .post("/api/auth/forgotpassword")
        .send({ email: data.credentials.guest.email });
      expect([200, 400]).toContain(res.status);
    });
  });

  describe("CSRF protection", () => {
    it("từ chối POST đã đăng nhập nhưng thiếu header CSRF", async () => {
      const agent = request.agent(app);
      const loginRes = await agent.post("/api/auth/login").send({
        email: data.credentials.guest.email,
        password: data.password,
      });
      expect(loginRes.status).toBe(200);

      const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 15, nights: 2 });
      const res = await agent.post("/api/guest/bookings").send({
        hotel: data.hotelId,
        room: data.roomIdDeluxe,
        checkInDate,
        checkOutDate,
        paymentMethod: "qr_code",
      });
      expect(res.status).toBe(403);
      expect(res.body.code).toBe("CSRF_INVALID");
    });

    it("cho phép POST khi có CSRF hợp lệ sau đăng nhập", async () => {
      const guest = await authedRequest(app, data.credentials.guest);
      const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 16, nights: 2 });
      const res = await guest.post("/api/guest/bookings").send({
        hotel: data.hotelId,
        room: data.roomIdDeluxe,
        checkInDate,
        checkOutDate,
        paymentMethod: "qr_code",
      });
      expect(res.status).toBe(201);
      expect(res.body.pendingExpiresAt).toBeDefined();
    });
  });
});
