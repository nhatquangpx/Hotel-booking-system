# Hệ thống đặt phòng khách sạn (Hotel Booking System)

Ứng dụng web full-stack hỗ trợ **tìm kiếm khách sạn, đặt phòng trực tuyến và vận hành khách sạn** với **bốn vai trò**: **Guest (khách hàng)**, **Owner (chủ khách sạn)**, **Staff (nhân viên)** và **Admin (quản trị viên)**.

Giao diện responsive; API có lớp **validation** (`express-validator`) trên các thao tác ghi dữ liệu quan trọng.

---

## Tính năng theo vai trò

### Guest — Khách hàng (`/`)
| Nhóm | Mô tả |
|------|--------|
| Khám phá | Trang chủ, danh sách/lọc khách sạn, chi tiết KS (ảnh, chính sách, đánh giá) |
| Đặt phòng | Kiểm tra phòng trống, xem trước giá (có áp dụng **sale** theo đêm), tạo đơn |
| Thanh toán | **QR chuyển khoản** (upload biên lai) hoặc **VNPay**; callback sau thanh toán |
| Tài khoản | Hồ sơ, đổi mật khẩu, danh sách đơn, hủy đơn (theo chính sách hoàn tiền KS) |
| Khác | Yêu thích (wishlist), đánh giá sau lưu trú, thông báo real-time, liên hệ |

### Owner — Chủ khách sạn (`/owner`)
| Nhóm | Mô tả |
|------|--------|
| Vận hành | Dashboard, sơ đồ phòng, tạo/sửa/xóa phòng (modal), lịch sử đặt theo phòng |
| Đơn đặt | Xem và xử lý đơn (xác nhận QR, trạng thái, hoàn tiền khi khách hủy) |
| Giá & khuyến mãi | Gợi ý **định giá động**, quản lý **chương trình sale** |
| Khách sạn | Cập nhật thông tin KS, QR thanh toán, liên hệ bảo trì |
| Thiết bị | Quản lý thiết bị/phòng, yêu cầu sửa chữa |
| Đánh giá | Xem và phản hồi review; xóa phản hồi (xác nhận trong UI) |
| Bảo mật | **2FA bắt buộc** (cùng Admin) |

### Staff — Nhân viên (`/staff`)
| Nhóm | Mô tả |
|------|--------|
| Lễ tân | Sơ đồ phòng, check-in / check-out đơn |
| Phòng | Xem chi tiết phòng, cập nhật trạng thái phòng (khi trống) |
| Thiết bị | CRUD thiết bị theo phòng, gửi yêu cầu sửa chữa |
| Đánh giá | Xem review, trả lời / xóa phản hồi thay mặt KS |
| Khác | Dashboard, thông báo, hồ sơ cá nhân |

> Staff gắn với **một khách sạn** (middleware `attachStaffHotel`).

### Admin — Quản trị viên (`/admin`)
| Nhóm | Mô tả |
|------|--------|
| Người dùng | CRUD user theo role; xem theo nhóm hoặc theo KS |
| Khách sạn | CRUD KS (modal), gán owner, cấu hình QR & chính sách hoàn tiền |
| Phòng | Tạo/sửa/xóa phòng qua **modal** (không dùng trang edit riêng) |
| Đơn đặt | Xem toàn hệ thống, chi tiết đơn (dialog) |
| Hệ thống | Dashboard thống kê, xuất báo cáo Excel, hộp thư liên hệ & trả lời |
| Bảo mật | **2FA bắt buộc**, quản lý hồ sơ admin |

---

## Công nghệ

| Tầng | Công nghệ |
|------|-----------|
| Frontend | React 18, Vite, React Router 6, Redux Toolkit, SCSS, Material UI, Axios, Socket.IO Client, React Toastify |
| Backend | Node.js, Express 4, MongoDB (Mongoose), Socket.IO |
| Xác thực | JWT (access + refresh trong **HttpOnly cookie**), bcrypt, 2FA (OTP email / mã dự phòng) |
| Validation | **express-validator** (`server/validations/*`) |
| Upload | Multer + Cloudinary |
| Thanh toán | VNPay (sandbox/production), QR chuyển khoản theo cấu hình từng KS |
| Email | Nodemailer (OTP, nhắc check-in, liên hệ, bảo trì…) |
| Lịch | node-cron (email nhắc, tắt sale hết hạn) |

---

## Cấu trúc thư mục

```
Hotel-booking-system/
├── client/                 # React (Vite)
│   ├── src/
│   │   ├── apis/           # API theo role (guest, owner, staff, admin)
│   │   ├── components/     # UI dùng chung (Dialog, RoomFacilitiesPicker…)
│   │   ├── constants/      # routes, roles, roomFacilities
│   │   ├── features/       # guest | owner | staff | admin | auth | notifications
│   │   ├── routes/         # AppRoutes + ProtectedRoute
│   │   └── shared/         # hooks, utils
│   └── .env.example
├── server/
│   ├── config/             # DB, multer/Cloudinary
│   ├── controllers/
│   ├── middlewares/        # auth, authorization, hotel staff
│   ├── models/
│   ├── routes/             # auth, guest, admin, owner, staff, payment
│   ├── services/           # booking, sale, pricing, notifications, emails…
│   ├── validations/        # express-validator rules
│   ├── socket/
│   └── .env.example
└── README.md
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

Các module trong `server/validations/`: `auth`, `register`, `booking`, `hotel`, `room`, `user`, `profile`, `review`, `contact`, `payment`, `sale`, `pricing`, `equipment`, `params`, `common`.

- Middleware `validate` trả `400` kèm `message` và `errors[]`.
- Upload multipart: multer chạy **trước** validation (ví dụ xác nhận QR, tạo KS/phòng).
- Một số rule nghiệp vụ: giá phòng JSON `{ regular, discount }`, đặt phòng chấp nhận `hotel`/`room` hoặc `hotelId`/`roomId`, ngưỡng hoàn tiền theo chính sách KS.

---

## Cài đặt chạy local

### Yêu cầu
- Node.js 18+
- MongoDB (Atlas hoặc local)
- Tài khoản Cloudinary (ảnh), Gmail/SMTP (email), VNPay sandbox (tùy chọn demo thanh toán)

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

Mặc định Vite: `http://localhost:3000` (hoặc port Vite in ra terminal).

### 3. Kiểm tra
- `GET http://localhost:8001/health` → `{ "status": "ok", ... }`
- Đăng nhập đúng role → redirect theo `ROLE_HOME_ROUTES` (`guest` → `/`, `admin` → `/admin`, …)

---

## Biến môi trường chính

Chi tiết: `server/.env.example`, `client/.env.example`.

| Biến | Mô tả |
|------|--------|
| `MONGO_URL` | Chuỗi kết nối MongoDB |
| `JWT_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_DAYS` | Token |
| `FRONTEND_URL` | Origin frontend (CORS + cookie) |
| `VITE_API_URL` | Base API cho client (`…/api`) |
| `CLOUDINARY_*` | Upload ảnh |
| `EMAIL_USER`, `EMAIL_PASS` | Gửi mail |
| `VNPAY_*` | Cổng VNPay |
| `DEFAULT_QR_*` | QR mặc định khi tạo KS (admin) |

---

## Luồng nghiệp vụ tiêu biểu

1. **Đặt phòng:** Guest chọn ngày → `price-preview` (sale theo đêm) → `POST /guest/bookings` → QR hoặc VNPay.
2. **QR:** Guest upload biên lai → Owner/Staff xác nhận thanh toán trên đơn.
3. **Sale:** Owner tạo chương trình → `salePricingService` tính đêm sale/regular → hiển thị breakdown cho guest.
4. **Thông báo:** Socket.IO + lưu DB; chuông thông báo trên header các role.
5. **Hủy & hoàn tiền:** Theo `refundMinDaysBeforeCheckIn` trên chính sách KS (đơn đã thanh toán).

---

## Scripts

| Thư mục | Lệnh | Mô tả |
|---------|------|--------|
| `server/` | `npm run dev` | Nodemon API |
| `server/` | `npm start` | Chạy production |
| `client/` | `npm run dev` | Vite dev server |
| `client/` | `npm run build` | Build production |

---

## Ghi chú triển khai

- Production: đặt `NODE_ENV=production`, `FRONTEND_URL` trùng domain client, dùng HTTPS để cookie hoạt động cross-site.
- CORS cho phép origin trong `FRONTEND_URL` và `*.vercel.app` (xem `server/index.js`).
- Admin/Owner bật 2FA khi đăng nhập lần đầu (theo cấu hình role).
- Chưa có bộ **unit/integration test** tự động; kiểm thử chủ yếu thủ công trên các luồng demo ở trên.

---

## License

Dự án phục vụ mục đích học tập / đồ án tốt nghiệp. Điều chỉnh license khi phát hành chính thức.
