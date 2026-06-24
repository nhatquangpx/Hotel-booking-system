const request = require("supertest");
const { seedTestData } = require("./helpers/seed");
const { authedRequest } = require("./helpers/auth");

const ROLE_PREFIXES = [
  { role: "guest", prefix: "/api/guest", protectedPath: "/profile" },
  { role: "admin", prefix: "/api/admin", protectedPath: "/profile" },
  { role: "owner", prefix: "/api/owner", protectedPath: "/profile" },
  { role: "staff", prefix: "/api/staff", protectedPath: "/profile" },
];

describe("Authorization — phân quyền 4 role (black box)", () => {
  let app;
  let data;

  beforeEach(async () => {
    app = global.getTestApp();
    data = await seedTestData();
  });

  describe("Truy cập không đăng nhập", () => {
    for (const { prefix, protectedPath } of ROLE_PREFIXES) {
      it(`401 khi truy cập ${prefix}${protectedPath} không token`, async () => {
        const res = await request(app).get(`${prefix}${protectedPath}`);
        expect(res.status).toBe(401);
      });
    }
  });

  describe("Sai role — WRONG_ROLE 403", () => {
    const allRoles = ["guest", "admin", "owner", "staff"];

    for (const target of ROLE_PREFIXES) {
      for (const actorRole of allRoles) {
        if (actorRole === target.role) continue;

        it(`${actorRole} không truy cập được ${target.prefix}`, async () => {
          const client = await authedRequest(app, data.credentials[actorRole]);
          const res = await client.get(`${target.prefix}${target.protectedPath}`);
          expect(res.status).toBe(403);
          expect(res.body.code).toBe("WRONG_ROLE");
          expect(res.body.requiredRole).toBe(target.role);
        });
      }
    }
  });

  describe("Đúng role — truy cập thành công", () => {
    for (const { role, prefix, protectedPath } of ROLE_PREFIXES) {
      it(`${role} truy cập ${prefix}${protectedPath}`, async () => {
        const client = await authedRequest(app, data.credentials[role]);
        const res = await client.get(`${prefix}${protectedPath}`);
        expect(res.status).toBe(200);
      });
    }
  });

  describe("Guest không truy cập admin/owner/staff routes", () => {
    const forbidden = ["/api/admin/users", "/api/owner/hotels", "/api/staff/dashboard"];

    for (const path of forbidden) {
      it(`guest bị chặn ${path}`, async () => {
        const client = await authedRequest(app, data.credentials.guest);
        const res = await client.get(path);
        expect(res.status).toBe(403);
      });
    }
  });

  describe("Payment chỉ dành cho guest", () => {
    it("admin không tạo VNPay URL", async () => {
      const client = await authedRequest(app, data.credentials.admin);
      const res = await client
        .post("/api/payment/vnpay/create-payment-url")
        .send({ bookingId: data.pendingBookingId });
      expect(res.status).toBe(403);
    });

    it("guest truy cập /api/payment/transactions", async () => {
      const client = await authedRequest(app, data.credentials.guest);
      const res = await client.get("/api/payment/transactions");
      expect(res.status).toBe(200);
    });
  });
});
