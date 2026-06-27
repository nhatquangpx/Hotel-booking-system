# StayJourney — Hệ thống đặt phòng khách sạn

**StayJourney** là ứng dụng web full-stack hỗ trợ **tìm kiếm khách sạn, đặt phòng trực tuyến và vận hành khách sạn** với **bốn vai trò**: **Guest (khách hàng)**, **Owner (chủ khách sạn)**, **Staff (nhân viên)** và **Admin (quản trị viên)**.

Giao diện responsive; API có lớp **validation** (`express-validator`) và **CSRF protection** trên các thao tác ghi dữ liệu quan trọng.

> Dự án phục vụ mục đích học tập / đồ án tốt nghiệp — chạy trên môi trường **local**.

---

## Tính năng theo vai trò

### Guest — Khách hàng (`/`)

| Nhóm | Mô tả |
|------|--------|
| Khám phá | Trang chủ, giới thiệu (`/about`), danh sách/lọc khách sạn, chi tiết KS (ảnh, chính sách, đánh giá) |
| Đặt phòng | Kiểm tra phòng trống, xem trước giá (có áp dụng **sale** theo đêm), tạo đơn |
| Thanh toán | **QR chuyển khoản** (upload biên lai) hoặc **VNPay sandbox**; callback sau thanh toán |
| Tài khoản | Hồ sơ, đổi mật khẩu, danh sách đơn, hủy đơn (theo chính sách hoàn tiền KS) |
| Khác | Yêu thích (wishlist), đánh giá sau lưu trú, thông báo real-time (Socket.IO), liên hệ |

### Owner — Chủ khách sạn (`/owner`)

| Nhóm | Mô tả |
|------|--------|
| Vận hành | Dashboard, sơ đồ phòng, tạo/sửa/xóa phòng (modal), lịch sử đặt theo phòng |
| Đơn đặt | Xem và xử lý đơn (xác nhận QR, trạng thái, hoàn tiền khi khách hủy) |
| Giá & khuyến mãi | Gợi ý **định giá động** (`/owner/pricing`), quản lý **chương trình sale** (`/owner/sale`) |
| Khách sạn | Cập nhật thông tin KS, QR thanh toán, liên hệ bảo trì |
| Thiết bị | Quản lý thiết bị/phòng, yêu cầu sửa chữa |
| Đánh giá | Xem và phản hồi review; xóa phản hồi (xác nhận trong UI) |
| Bảo mật | **2FA bắt buộc** (cùng Admin) |

> Owner có thể quản lý **nhiều khách sạn** — chọn KS qua `OwnerHotelContext`.

### Staff — Nhân viên (`/staff`)

| Nhóm | Mô tả |
|------|--------|
| Lễ tân | Dashboard, sơ đồ phòng, check-in / check-out đơn |
| Đơn đặt | Danh sách và lọc đơn theo trạng thái |
| Phòng | Xem chi tiết phòng, cập nhật trạng thái phòng (khi trống) |
| Thiết bị | CRUD thiết bị theo phòng, gửi yêu cầu sửa chữa |
| Đánh giá | Xem review, trả lời / xóa phản hồi thay mặt KS |
| Khác | Thông báo, hồ sơ cá nhân |

> Staff gắn với **một khách sạn** (middleware `attachStaffHotel`).

### Admin — Quản trị viên (`/admin`)

| Nhóm | Mô tả |
|------|--------|
| Người dùng | CRUD user theo role; xem theo nhóm hoặc theo KS |
| Khách sạn | CRUD KS (modal), gán owner, cấu hình QR & chính sách hoàn tiền |
| Phòng | Tạo/sửa/xóa phòng qua **modal** (không dùng trang edit riêng) |
| Đơn đặt | Xem toàn hệ thống, chi tiết đơn (dialog), **xuất báo cáo doanh thu Excel** |
| Hệ thống | Dashboard thống kê, hộp thư liên hệ & trả lời |
| Bảo mật | **2FA bắt buộc**, quản lý hồ sơ admin |

---

## Công nghệ

| Tầng | Công nghệ |
|------|-----------|
| Frontend | React 18, Vite 5, React Router 6, Redux Toolkit, SCSS, Material UI, Axios, Socket.IO Client, React Toastify, Font Awesome / React Icons |
| Backend | Node.js, Express 4, MongoDB (Mongoose 8), Socket.IO |
| Xác thực | JWT (access + refresh trong **HttpOnly cookie**), bcryptjs, 2FA (OTP email / mã dự phòng) |
| Bảo mật API | **CSRF** (double-submit cookie), `express-validator` |
| Upload | Multer + Cloudinary |
| Thanh toán | VNPay sandbox, QR chuyển khoản theo cấu hình từng KS |
| Email | Nodemailer / Gmail SMTP (OTP, nhắc check-in, liên hệ, bảo trì…) |
| Báo cáo | ExcelJS (xuất doanh thu) |
| Lịch | node-cron (email nhắc 9:00, tắt sale hết hạn 00:05, hủy đơn pending quá hạn mỗi 5 phút) |
| Kiểm thử | Jest, Supertest, mongodb-memory-server (`server/tests/`) |

---

## Cấu trúc thư mục

```
StayJourney/
├── client/                 # React (Vite)
│   ├── src/
│   │   ├── apis/           # API theo role (guest, owner, staff, admin)
│   │   ├── components/     # UI dùng chung
│   │   ├── constants/      # routes, roles, roomFacilities, cities…
│   │   ├── features/       # guest | owner | staff | admin | auth | notifications
│   │   ├── routes/         # AppRoutes + ProtectedRoute
│   │   └── shared/         # hooks, utils, socket, components
│   └── .env.example
├── server/
│   ├── config/             # DB, multer/Cloudinary
│   ├── controllers/
│   ├── lib/                # auth cookie, CSRF, booking helpers, pagination…
│   ├── middlewares/        # auth, authorization, CSRF, hotel staff
│   ├── models/             # User, Hotel, Room, Booking, Review, SalePromotion…
│   ├── routes/             # auth, guest, admin, owner, staff, payment
│   ├── scripts/            # seed, reset, supplement dữ liệu mẫu
│   ├── services/           # booking, sale, pricing, notifications, emails…
│   ├── socket/
│   ├── tests/              # API integration tests (Jest)
│   ├── validations/        # express-validator rules
│   └── .env.example
├── README.md
└── HUONG_DAN_CAI_DAT.md
```

---

## API (prefix)

| Prefix | Vai trò / mục đích |
|--------|---------------------|
| `/api/auth` | Đăng ký, đăng nhập, refresh, 2FA, quên mật khẩu |
| `/api/guest` | Công khai + guest đã đăng nhập |
| `/api/owner` | Chủ KS |
| `/api/staff` | Nhân viên KS |
| `/api/admin` | Quản trị |
| `/api/payment` | VNPay, xác nhận QR |
| `/health` | Health check |

---

## Validation (server)

Các module trong `server/validations/`: `auth` (gồm đăng ký), `booking`, `hotel`, `room`, `user`, `profile`, `review`, `contact`, `payment`, `sale`, `pricing`, `equipment`, `params`, `common`.

- Middleware `validate` trả `400` kèm `message` và `errors[]`.
- Upload multipart: multer chạy **trước** validation (ví dụ xác nhận QR, tạo KS/phòng).
- Một số rule nghiệp vụ: giá phòng JSON `{ regular, discount }`, đặt phòng chấp nhận `hotel`/`room` hoặc `hotelId`/`roomId`, ngưỡng hoàn tiền theo chính sách KS.

---

## Cài đặt chạy local

> Hướng dẫn chi tiết (MongoDB, Cloudinary, Gmail, VNPay, seed DB, xử lý lỗi): **[HUONG_DAN_CAI_DAT.md](./HUONG_DAN_CAI_DAT.md)**

### Yêu cầu

- Node.js 18+
- MongoDB (Atlas hoặc local)
- Tài khoản Cloudinary (ảnh), Gmail App Password (email), VNPay sandbox (tùy chọn demo thanh toán)

### 1. Backend

```bash
cd server
cp .env.example .env
# Chỉnh MONGO_URL, JWT_SECRET, FRONTEND_URL, Cloudinary, Email, VNPay…
npm install
npm run dev
```

Mặc định: `http://localhost:8001`

### 2. Frontend

```bash
cd client
cp .env.example .env
# VITE_API_URL=http://localhost:8001/api
npm install
npm run dev
```

Mặc định Vite: `http://localhost:3000`

### 3. Seed dữ liệu mẫu (khuyến nghị)

```bash
cd server
npm run db:seed
```

Mật khẩu demo: `123456` — xem danh sách tài khoản trong [HUONG_DAN_CAI_DAT.md](./HUONG_DAN_CAI_DAT.md#9-seed-dữ-liệu-mẫu).

### 4. Kiểm tra

- `GET http://localhost:8001/health` → `{ "status": "ok", ... }`
- Đăng nhập đúng role → redirect theo `ROLE_HOME_ROUTES` (`guest` → `/`, `admin` → `/admin`, …)

---

## Biến môi trường chính

Chi tiết: `server/.env.example`, `client/.env.example`.

| Biến | Mô tả |
|------|--------|
| `MONGO_URL`, `MONGO_DB_NAME` | Kết nối MongoDB (mặc định DB: `StayJourney`) |
| `JWT_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_DAYS` | Token |
| `FRONTEND_URL` | Origin frontend local (`http://localhost:3000`) — CORS + cookie |
| `VITE_API_URL` | Base API cho client (`http://localhost:8001/api`) |
| `CLOUDINARY_*` | Upload ảnh |
| `EMAIL_USER`, `EMAIL_PASS` | Gửi mail (Gmail App Password) |
| `VNPAY_*` | Cổng VNPay sandbox |
| `DEFAULT_QR_*` | QR mặc định khi tạo KS (admin) |
| `BOOKING_PENDING_HOLD_MINUTES` | Thời gian giữ phòng khi đơn pending (mặc định 30 phút) |

---

## Luồng nghiệp vụ tiêu biểu

1. **Đặt phòng:** Guest chọn ngày → `price-preview` (sale theo đêm) → `POST /guest/bookings` → QR hoặc VNPay.
2. **Giữ phòng:** Đơn `pending` được giữ trong `BOOKING_PENDING_HOLD_MINUTES`; cron tự hủy nếu quá hạn.
3. **QR:** Guest upload biên lai → Owner/Staff xác nhận thanh toán trên đơn.
4. **Sale:** Owner tạo chương trình → `salePricingService` tính đêm sale/regular → hiển thị breakdown cho guest.
5. **Thông báo:** Socket.IO + lưu DB; chuông thông báo trên header các role.
6. **Hủy & hoàn tiền:** Theo `refundMinDaysBeforeCheckIn` trên chính sách KS (đơn đã thanh toán).

---

## Scripts

### Server (`server/`)

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Nodemon API (development) |
| `npm start` | Chạy API (không hot-reload) |
| `npm test` | Chạy toàn bộ API tests |
| `npm run test:watch` | Tests ở chế độ watch |
| `npm run test:coverage` | Báo cáo coverage |
| `npm run db:seed` | Seed dữ liệu mẫu |
| `npm run db:reset` | Xóa toàn bộ collection |
| `npm run db:reseed` | Reset rồi seed lại |
| `npm run db:supplement` | Bổ sung dữ liệu |
| `npm run db:supplement-equipment` | Bổ sung thiết bị phòng |

### Client (`client/`)

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Vite dev server |
| `npm run build` | Build static (không dùng trong phạm vi đồ án) |
| `npm run preview` | Xem trước bản build |

---

## Kiểm thử

Bộ test API tích hợp nằm trong `server/tests/`, dùng **Jest + Supertest** với MongoDB in-memory:

| File test | Phạm vi |
|-----------|---------|
| `auth.test.js` | Đăng ký, đăng nhập, refresh, 2FA |
| `guest.test.js` | API guest |
| `owner.test.js` | API owner |
| `staff.test.js` | API staff |
| `admin.test.js` | API admin |
| `payment.test.js` | VNPay, QR |
| `booking-lifecycle.test.js` | Vòng đời đơn đặt |
| `authorization.test.js` | Phân quyền theo role |

```bash
cd server
npm test
```

Ngoài test tự động, kiểm thử thủ công trên các luồng demo (đặt phòng, thanh toán, sale, check-in/out…).

---

## Ghi chú phát triển local

- `FRONTEND_URL` phải trùng URL frontend bạn mở trên trình duyệt (`http://localhost:3000`).
- Không trộn `localhost` với `127.0.0.1` giữa client và server.
- Admin/Owner bật **2FA** khi đăng nhập lần đầu (OTP qua email).
- Cron jobs chạy khi server đang bật: nhắc check-in (9:00), đồng bộ sale hết hạn (00:05), hủy đơn pending quá hạn (mỗi 5 phút) — múi giờ `Asia/Ho_Chi_Minh`.

---

## License

Dự án phục vụ mục đích học tập / đồ án tốt nghiệp.
