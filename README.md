# StayJourney — Hệ thống đặt phòng khách sạn

**StayJourney** là ứng dụng web full-stack hỗ trợ **tìm kiếm khách sạn, đặt phòng trực tuyến và vận hành chuỗi khách sạn** với **bốn vai trò**: **Guest (khách hàng)**, **Owner (chủ khách sạn)**, **Staff (nhân viên)** và **Admin (quản trị viên)**.

Giao diện responsive; API có lớp **validation** (`express-validator`) và **CSRF protection** trên các thao tác ghi dữ liệu quan trọng.

> Dự án phục vụ mục đích học tập / đồ án tốt nghiệp — chạy trên môi trường **local** (không bao gồm deploy production).

**Hướng dẫn cài đặt chi tiết (PDF):** ` Huong-dan-cai-dat.pdf` 

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
| Backend | Node.js, Express 4, MongoDB (Mongoose 8), Socket.IO, node-cron |
| Xác thực | JWT (access + refresh trong **HttpOnly cookie**), bcryptjs, 2FA (OTP email / mã dự phòng) |
| Bảo mật API | **CSRF** (double-submit cookie), `express-validator` |
| Upload | Multer + Cloudinary (fallback lưu local `server/uploads/`) |
| Thanh toán | VNPay sandbox, QR chuyển khoản theo cấu hình từng KS |
| Email | Nodemailer / Gmail SMTP (OTP, nhắc check-in, liên hệ, bảo trì…) |
| Báo cáo | ExcelJS (xuất doanh thu) |
| Lịch | node-cron (email nhắc 9:00, tắt sale hết hạn 00:05, hủy đơn pending quá hạn mỗi 5 phút) — múi giờ `Asia/Ho_Chi_Minh` |
| Kiểm thử | Jest, Supertest, mongodb-memory-server (`server/tests/`, 161 test cases) |

---

## Cấu trúc thư mục

```
Hotel-booking-system/
├── client/                 # React (Vite), port 3000
│   ├── src/
│   │   ├── apis/           # API theo role (guest, owner, staff, admin)
│   │   ├── components/     # UI dùng chung
│   │   ├── constants/      # routes, roles, roomFacilities, cities…
│   │   ├── features/       # guest | owner | staff | admin | auth | notifications
│   │   ├── routes/         # AppRoutes + ProtectedRoute
│   │   └── shared/         # hooks, utils, socket, components
│   └── .env.example
├── server/                 # Node.js (Express), port 8001
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
│   ├── uploads/            # Ảnh local khi chưa cấu hình Cloudinary
│   ├── validations/        # express-validator rules
│   └── .env.example
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

## Cài đặt và chạy local

### Yêu cầu

| Phần mềm | Phiên bản |
|----------|-----------|
| Node.js | 18+ (LTS) |
| npm | Đi kèm Node.js |
| MongoDB | Atlas (khuyến nghị) hoặc Community (local) |
| Gmail App Password | Bắt buộc nếu đăng nhập Admin/Owner (2FA qua email) |
| Cloudinary | Khuyến nghị (thiếu → lưu ảnh tại `server/uploads/`) |
| VNPay Sandbox | Tùy chọn (demo thanh toán online) |

### Mô hình local

| Thành phần | URL |
|------------|-----|
| Frontend (Vite) | `http://localhost:3000` |
| Backend API | `http://localhost:8001/api` |
| Socket.IO | `http://localhost:8001` |
| Health check | `GET http://localhost:8001/health` |

Client gọi API **trực tiếp** qua `VITE_API_URL` (không dùng Vite proxy). JWT trong HttpOnly cookie; request ghi dữ liệu kèm header `X-CSRF-Token`.

### 1. Clone và cấu hình

```bash
git clone <url-repo-cua-ban>
cd Hotel-booking-system
```

**Backend** (`server/.env`):

```bash
cd server
cp .env.example .env   # Windows: Copy-Item .env.example .env
```

Điền tối thiểu: `MONGO_URL`, `MONGO_DB_NAME` (`StayJourney`), `JWT_SECRET`, `FRONTEND_URL` (`http://localhost:3000`), `EMAIL_USER`, `EMAIL_PASS`. Tùy chọn: `CLOUDINARY_*`, `VNPAY_*`, `DEFAULT_QR_*`.

**Frontend** (`client/.env`):

```bash
cd client
cp .env.example .env
```

```env
VITE_API_URL=http://localhost:8001/api
```

### 2. Cài dependencies

```bash
cd server && npm install
cd ../client && npm install
```

### 3. Seed dữ liệu mẫu (khuyến nghị lần đầu)

```bash
cd server
npm run db:reseed    # xóa DB rồi seed lại
# hoặc: npm run db:seed   # thêm dữ liệu, không xóa cũ
```

**Tài khoản demo** (mật khẩu chung: `123456`):

| Vai trò | Email |
|---------|--------|
| Guest | `quang.dn225911@sis.hust.edu.vn` |
| Admin | `doannhatquang0@gmail.com` |
| Owner | `nhtquangforwork@gmail.com` |
| Staff | `demonlord29082004@gmail.com` |

> Admin/Owner cần **email hoạt động** để nhận OTP 2FA khi đăng nhập lần đầu.

### 4. Chạy ứng dụng (2 terminal)

```bash
# Terminal 1 — Backend (:8001)
cd server
npm start            # hoặc npm run dev (cần nodemon: npm i -g nodemon)

# Terminal 2 — Frontend (:3000)
cd client
npm run dev
```

Mở `http://localhost:3000`. Đăng nhập đúng role → redirect: Guest `/`, Owner `/owner`, Staff `/staff`, Admin `/admin`.

### 5. Kiểm tra

```bash
curl http://localhost:8001/health
# → { "status": "ok", ... }

cd server && npm test
# → 161/161 test cases
```

---

## Biến môi trường chính

Chi tiết: `server/.env.example`, `client/.env.example`. Xem đầy đủ trong `Huong-dan-cai-dat.pdf`.

| Biến | Mô tả |
|------|--------|
| `MONGO_URL`, `MONGO_DB_NAME` | Kết nối MongoDB (mặc định DB: `StayJourney`) |
| `JWT_SECRET`, `JWT_ACCESS_EXPIRES`, `JWT_REFRESH_DAYS` | Token (refresh là **số ngày**, ví dụ `7`) |
| `FRONTEND_URL` | Origin frontend (`http://localhost:3000`) — CORS + cookie |
| `VITE_API_URL` | Base API client (`http://localhost:8001/api`) |
| `CLOUDINARY_*` | Upload ảnh cloud (thiếu → `server/uploads/`) |
| `EMAIL_USER`, `EMAIL_PASS` | Gmail App Password |
| `VNPAY_*` | Cổng VNPay sandbox |
| `DEFAULT_QR_*` | QR mặc định khi tạo KS (admin) |
| `BOOKING_PENDING_HOLD_MINUTES` | Giữ phòng khi đơn pending (mặc định 30 phút) |

---

## Luồng nghiệp vụ tiêu biểu

1. **Đặt phòng:** Guest chọn ngày → `price-preview` (sale theo đêm) → `POST /guest/bookings` → QR hoặc VNPay.
2. **Giữ phòng:** Đơn `pending` được giữ trong `BOOKING_PENDING_HOLD_MINUTES`; cron tự hủy nếu quá hạn (mỗi 5 phút).
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
| `npm start` | Chạy API (`node index.js`) |
| `npm test` | Chạy 161 API tests |
| `npm run test:watch` | Tests ở chế độ watch |
| `npm run test:coverage` | Báo cáo coverage |
| `npm run db:seed` | Thêm dữ liệu mẫu (không xóa cũ) |
| `npm run db:reset` | Xóa toàn bộ collection |
| `npm run db:reseed` | Reset rồi seed lại |
| `npm run db:supplement` | Bổ sung dữ liệu |
| `npm run db:supplement-equipment` | Bổ sung thiết bị phòng |

### Client (`client/`)

| Lệnh | Mô tả |
|------|--------|
| `npm run dev` | Vite dev server (port 3000) |
| `npm run build` | Build static → `dist/` |
| `npm run preview` | Xem trước bản build (port 4173) |

---

## Kiểm thử

Bộ test API tích hợp trong `server/tests/`, dùng **Jest + Supertest** với MongoDB in-memory:

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

---

## Ghi chú phát triển local

- `FRONTEND_URL` phải trùng URL frontend trên trình duyệt (`http://localhost:3000`).
- Không trộn `localhost` với `127.0.0.1` giữa client và server.
- Admin/Owner bật **2FA** khi đăng nhập lần đầu (OTP qua email, xử lý trên trang `/login`).
- Cron jobs chạy khi server đang bật — múi giờ `Asia/Ho_Chi_Minh`.
- Script seed/reset hardcode DB `StayJourney`; runtime server đọc `MONGO_DB_NAME`.
- `npm run dev` cần `nodemon` (chưa có trong `package.json`) — dùng `npm start` hoặc `npm i -g nodemon`.

---

## License

Dự án phục vụ mục đích học tập / đồ án tốt nghiệp.
