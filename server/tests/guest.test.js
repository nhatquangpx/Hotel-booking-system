const request = require("supertest");
const { seedTestData } = require("./helpers/seed");
const { authedRequest } = require("./helpers/auth");

describe("Guest — chức năng khách hàng", () => {
  let app;
  let data;
  let guest;

  beforeEach(async () => {
    app = global.getTestApp();
    data = await seedTestData();
    guest = await authedRequest(app, data.credentials.guest);
  });

  describe("API công khai", () => {
    it("GET /hotels — danh sách khách sạn", async () => {
      const res = await request(app).get("/api/guest/hotels").query({ all: true });
      expect(res.status).toBe(200);
      const hotels = Array.isArray(res.body) ? res.body : res.body.hotels;
      expect(hotels.length).toBeGreaterThan(0);
    });

    it("GET /hotels/cities", async () => {
      const res = await request(app).get("/api/guest/hotels/cities");
      expect(res.status).toBe(200);
    });

    it("GET /hotels/filter", async () => {
      const res = await request(app).get("/api/guest/hotels/filter").query({ city: "Hà Nội" });
      expect(res.status).toBe(200);
    });

    it("GET /hotels/featured", async () => {
      const res = await request(app).get("/api/guest/hotels/featured");
      expect(res.status).toBe(200);
    });

    it("GET /hotels/:id — chi tiết KS", async () => {
      const res = await request(app).get(`/api/guest/hotels/${data.hotelId}`);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe(data.hotelName);
    });

    it("GET /hotels/:hotelId/rooms", async () => {
      const res = await request(app).get(`/api/guest/hotels/${data.hotelId}/rooms`);
      expect(res.status).toBe(200);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it("GET /rooms/:id", async () => {
      const res = await request(app).get(`/api/guest/rooms/${data.roomId}`);
      expect(res.status).toBe(200);
      expect(res.body.roomNumber).toBe("101");
    });

    it("POST /contact — gửi liên hệ", async () => {
      const res = await request(app).post("/api/guest/contact").send({
        name: "Test Contact",
        email: "contact2@test.com",
        subject: "Hỏi đáp",
        message: "Nội dung liên hệ test",
      });
      expect(res.status).toBe(200);
    });

    it("GET /reviews/hotel/:hotelId", async () => {
      const res = await request(app).get(`/api/guest/reviews/hotel/${data.hotelId}`);
      expect(res.status).toBe(200);
    });
  });

  describe("Profile", () => {
    it("GET /profile", async () => {
      const res = await guest.get("/api/guest/profile");
      expect(res.status).toBe(200);
      expect(res.body.email).toBe(data.credentials.guest.email);
    });

    it("PUT /profile — cập nhật tên", async () => {
      const res = await guest.put("/api/guest/profile").send({ name: "Guest Updated" });
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Guest Updated");
    });

    it("PUT /profile/changepassword", async () => {
      const res = await guest
        .put("/api/guest/profile/changepassword")
        .send({ currentPassword: data.password, newPassword: "654321" });
      expect(res.status).toBe(200);
    });
  });

  describe("Booking", () => {
    it("GET /bookings — danh sách đặt phòng", async () => {
      const res = await guest.get("/api/guest/bookings");
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.bookings)).toBe(true);
      expect(res.body.pagination).toMatchObject({
        page: expect.any(Number),
        limit: expect.any(Number),
        total: expect.any(Number),
        totalPages: expect.any(Number),
      });
      expect(Array.isArray(res.body.filterHotels)).toBe(true);
    });

    it("GET /bookings/available-rooms", async () => {
      const { checkInDate, checkOutDate } = data.futureStayDates();
      const res = await guest.get("/api/guest/bookings/available-rooms").query({
        hotelId: data.hotelId,
        checkInDate,
        checkOutDate,
      });
      expect(res.status).toBe(200);
    });

    it("GET /bookings/price-preview", async () => {
      const { checkInDate, checkOutDate } = data.futureStayDates();
      const res = await guest.get("/api/guest/bookings/price-preview").query({
        hotelId: data.hotelId,
        roomId: data.roomIdDeluxe,
        checkInDate,
        checkOutDate,
      });
      expect(res.status).toBe(200);
      expect(res.body.finalAmount).toBeDefined();
    });

    it("POST /bookings — tạo đặt phòng", async () => {
      const { checkInDate, checkOutDate } = data.futureStayDates({ checkInOffset: 10 });
      const res = await guest.post("/api/guest/bookings").send({
        hotel: data.hotelId,
        room: data.roomIdDeluxe,
        checkInDate,
        checkOutDate,
        paymentMethod: "qr_code",
      });
      expect(res.status).toBe(201);
      expect(res.body.paymentStatus).toBe("pending");
    });

    it("POST /bookings — từ chối ngày quá khứ", async () => {
      const res = await guest.post("/api/guest/bookings").send({
        hotel: data.hotelId,
        room: data.roomIdDeluxe,
        checkInDate: "2020-01-01",
        checkOutDate: "2020-01-03",
      });
      expect([400, 500]).toContain(res.status);
    });

    it("POST /bookings — từ chối KS inactive", async () => {
      const { checkInDate, checkOutDate } = data.futureStayDates();
      const res = await guest.post("/api/guest/bookings").send({
        hotel: data.inactiveHotelId,
        room: data.roomId,
        checkInDate,
        checkOutDate,
      });
      expect(res.status).toBe(400);
    });

    it("GET /bookings/:id", async () => {
      const res = await guest.get(`/api/guest/bookings/${data.pendingBookingId}`);
      expect(res.status).toBe(200);
    });

    it("PUT /bookings/:id/cancel — hủy đơn pending", async () => {
      const res = await guest
        .put(`/api/guest/bookings/${data.pendingBookingId}/cancel`)
        .send({ cancellationReason: "Đổi kế hoạch" });
      expect(res.status).toBe(200);
      expect(res.body.booking.paymentStatus).toBe("cancelled");
    });
  });

  describe("Wishlist", () => {
    it("POST /wishlist/:hotelId — thêm/xóa", async () => {
      const res = await guest.post(`/api/guest/wishlist/${data.hotelId}`);
      expect(res.status).toBe(200);
    });

    it("GET /wishlist", async () => {
      await guest.post(`/api/guest/wishlist/${data.hotelId}`);
      const res = await guest.get("/api/guest/wishlist");
      expect(res.status).toBe(200);
    });
  });

  describe("Notifications", () => {
    it("GET /notifications", async () => {
      const res = await guest.get("/api/guest/notifications");
      expect(res.status).toBe(200);
    });

    it("GET /notifications/unread-count", async () => {
      const res = await guest.get("/api/guest/notifications/unread-count");
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("unreadCount");
    });

    it("PUT /notifications/read-all", async () => {
      const res = await guest.put("/api/guest/notifications/read-all");
      expect(res.status).toBe(200);
    });
  });
});
