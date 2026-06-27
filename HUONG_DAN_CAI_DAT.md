# Hướng dẫn cài đặt StayJourney

Tài liệu này hướng dẫn cài đặt và chạy dự án **StayJourney** trên máy local (phạm vi đồ án — không bao gồm deploy production). Xem [README.md](./README.md) để biết tổng quan tính năng và kiến trúc.

---

## Mục lục

1. [Yêu cầu hệ thống](#1-yêu-cầu-hệ-thống)
2. [Clone dự án](#2-clone-dự-án)
3. [Cài đặt MongoDB](#3-cài-đặt-mongodb)
4. [Cấu hình Backend](#4-cấu-hình-backend)
5. [Cấu hình Frontend](#5-cấu-hình-frontend)
6. [Dịch vụ bên thứ ba (tùy chọn nhưng khuyến nghị)](#6-dịch-vụ-bên-thứ-ba)
7. [Cài đặt dependencies](#7-cài-đặt-dependencies)
8. [Chạy ứng dụng](#8-chạy-ứng-dụng)
9. [Seed dữ liệu mẫu](#9-seed-dữ-liệu-mẫu)
10. [Kiểm tra sau cài đặt](#10-kiểm-tra-sau-cài-đặt)
11. [Xử lý lỗi thường gặp](#11-xử-lý-lỗi-thường-gặp)

---

## 1. Yêu cầu hệ thống

| Phần mềm | Phiên bản khuyến nghị |
|----------|------------------------|
| **Node.js** | 18 trở lên (LTS) |
| **npm** | Đi kèm Node.js |
| **Git** | Bất kỳ bản mới |
| **MongoDB** | Atlas (cloud) hoặc MongoDB Community (local) |

Kiểm tra nhanh:

```bash
node -v
npm -v
git --version
```

---

## 2. Clone dự án

```bash
git clone <url-repo-cua-ban>
cd StayJourney
```

Cấu trúc chính:

```
StayJourney/
├── client/          # Frontend React (Vite)
├── server/          # Backend Node.js (Express)
├── README.md
└── HUONG_DAN_CAI_DAT.md
```

---

## 3. Cài đặt MongoDB

### Cách A — MongoDB Atlas (khuyến nghị cho người mới)

1. Truy cập [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas) và tạo tài khoản miễn phí.
2. Tạo **cluster** (chọn gói Free).
3. Vào **Database Access** → tạo user (username + password).
4. Vào **Network Access** → **Add IP Address** → chọn `0.0.0.0/0` (cho dev) hoặc IP máy bạn.
5. Vào **Connect** → **Drivers** → copy connection string, dạng:

   ```
   mongodb+srv://<user>:<password>@<cluster>.mongodb.net/?retryWrites=true&w=majority
   ```

6. Thay `<user>` và `<password>` bằng thông tin thật (nếu mật khẩu có ký tự đặc biệt, cần URL-encode).

Database mặc định của dự án: **`StayJourney`** (cấu hình qua biến `MONGO_DB_NAME`).

### Cách B — MongoDB local

1. Cài [MongoDB Community Server](https://www.mongodb.com/try/download/community).
2. Khởi động service MongoDB trên máy.
3. Dùng connection string:

   ```
   mongodb://127.0.0.1:27017
   ```

---

## 4. Cấu hình Backend

### Tạo file `.env`

**Windows (PowerShell):**

```powershell
cd server
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cd server
cp .env.example .env
```

Mở `server/.env` và điền các giá trị sau.

### Biến bắt buộc

| Biến | Mô tả | Ví dụ |
|------|--------|-------|
| `PORT` | Cổng API | `8001` |
| `NODE_ENV` | Môi trường | `development` |
| `FRONTEND_URL` | URL frontend (CORS + cookie). **Không** có `/` cuối | `http://localhost:3000` |
| `MONGO_URL` | Chuỗi kết nối MongoDB | Xem mục 3 |
| `MONGO_DB_NAME` | Tên database | `StayJourney` |
| `JWT_SECRET` | Chuỗi bí mật ngẫu nhiên, tối thiểu 32 ký tự | `your-strong-random-secret-min-32-chars` |
| `JWT_ACCESS_EXPIRES` | Thời hạn access token | `15m` |
| `JWT_REFRESH_DAYS` | Số ngày refresh token (số nguyên) | `7` |

### Biến upload ảnh (Cloudinary)

| Biến | Mô tả |
|------|--------|
| `CLOUDINARY_CLOUD_NAME` | Cloud name từ dashboard Cloudinary |
| `CLOUDINARY_API_KEY` | API Key |
| `CLOUDINARY_API_SECRET` | API Secret |

> Không cấu hình Cloudinary → upload ảnh (avatar, ảnh KS, biên lai QR…) sẽ lỗi.

### Biến email (Gmail)

| Biến | Mô tả |
|------|--------|
| `EMAIL_USER` | Địa chỉ Gmail gửi mail |
| `EMAIL_PASS` | **App Password** (không dùng mật khẩu đăng nhập Gmail thường) |

Dùng cho: OTP 2FA, quên mật khẩu, nhắc check-in, liên hệ, bảo trì.

### Biến thanh toán QR mặc định

| Biến | Mô tả |
|------|--------|
| `DEFAULT_QR_ACCOUNT_NAME` | Tên chủ tài khoản |
| `DEFAULT_QR_ACCOUNT_NUMBER` | Số tài khoản |
| `DEFAULT_QR_BANK_NAME` | Tên ngân hàng |

### Biến VNPay (tùy chọn — demo thanh toán online)

| Biến | Mô tả |
|------|--------|
| `VNPAY_HOST` | `https://sandbox.vnpayment.vn` (sandbox) |
| `VNPAY_TMN_CODE` | Mã TMN từ VNPay |
| `VNPAY_SECURE_SECRET` | Secret key |
| `VNPAY_RETURN_URL` | `http://localhost:8001/api/payment/vnpay-return` |

### Ví dụ `.env` tối thiểu cho local

```env
PORT=8001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

MONGO_URL=mongodb+srv://user:pass@cluster.mongodb.net/?retryWrites=true&w=majority
MONGO_DB_NAME=StayJourney

JWT_SECRET=thay-bang-chuoi-bi-mat-ngau-nhien-32-ky-tu
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_DAYS=7

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-gmail-app-password

DEFAULT_QR_ACCOUNT_NAME=Ten chu tai khoan
DEFAULT_QR_ACCOUNT_NUMBER=1234567890
DEFAULT_QR_BANK_NAME=Vietcombank

VNPAY_HOST=https://sandbox.vnpayment.vn
VNPAY_TMN_CODE=your_tmn_code
VNPAY_SECURE_SECRET=your_secure_secret
VNPAY_RETURN_URL=http://localhost:8001/api/payment/vnpay-return
```

---

## 5. Cấu hình Frontend

### Tạo file `.env`

**Windows (PowerShell):**

```powershell
cd client
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cd client
cp .env.example .env
```

### Biến môi trường

| Biến | Mô tả | Giá trị local |
|------|--------|---------------|
| `VITE_API_URL` | Base URL API (**có** `/api` ở cuối) | `http://localhost:8001/api` |

> `FRONTEND_URL` (server) và `VITE_API_URL` (client) phải khớp origin/port khi chạy local.

---

## 6. Dịch vụ bên thứ ba

### Cloudinary (ảnh)

1. Đăng ký tại [https://cloudinary.com](https://cloudinary.com).
2. Vào **Dashboard** → copy **Cloud name**, **API Key**, **API Secret**.
3. Điền vào `server/.env`.

### Gmail App Password (email)

1. Bật **Xác minh 2 bước** cho tài khoản Google.
2. Vào [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords).
3. Tạo App Password cho ứng dụng **Mail**.
4. Dán mật khẩu 16 ký tự vào `EMAIL_PASS` (bỏ khoảng trắng nếu có).

### VNPay Sandbox (thanh toán)

1. Đăng ký tài khoản sandbox tại [https://sandbox.vnpayment.vn](https://sandbox.vnpayment.vn).
2. Lấy `TMN_CODE` và `HASH_SECRET` (Secure Secret).
3. Cấu hình `VNPAY_RETURN_URL` trỏ về backend local: `http://localhost:8001/api/payment/vnpay-return`.

---

## 7. Cài đặt dependencies

Mở **hai terminal** (hoặc chạy tuần tự):

**Terminal 1 — Backend:**

```bash
cd server
npm install
```

**Terminal 2 — Frontend:**

```bash
cd client
npm install
```

---

## 8. Chạy ứng dụng

### Development

**Terminal 1 — Backend** (mặc định `http://localhost:8001`):

```bash
cd server
npm run dev
```

Khi thành công, terminal hiển thị:
- `MongoDB connected!`
- `Email server is ready to send messages` (nếu cấu hình email đúng)
- Server lắng nghe cổng `8001`

**Terminal 2 — Frontend** (mặc định `http://localhost:3000`):

```bash
cd client
npm run dev
```

Mở trình duyệt tại URL Vite in ra (thường là `http://localhost:3000`).

### Thứ tự khuyến nghị

1. Khởi động MongoDB (nếu dùng local).
2. Chạy backend trước.
3. Chạy frontend sau.

---

## 9. Seed dữ liệu mẫu

Sau khi backend kết nối MongoDB thành công, chạy seed để có dữ liệu demo (user, khách sạn, phòng, đơn đặt…).

```bash
cd server
npm run db:seed
```

Các lệnh database khác:

| Lệnh | Mô tả |
|------|--------|
| `npm run db:seed` | Thêm dữ liệu mẫu (không xóa dữ liệu cũ) |
| `npm run db:reset` | Xóa toàn bộ collection |
| `npm run db:reseed` | Xóa hết rồi seed lại |
| `npm run db:supplement` | Bổ sung thêm dữ liệu |
| `npm run db:supplement-equipment` | Bổ sung thiết bị phòng |

### Tài khoản demo sau seed

Mật khẩu chung: **`123456`**

| Vai trò | Email |
|---------|--------|
| Guest | `quang.dn225911@sis.hust.edu.vn` |
| Admin | `doannhatquang0@gmail.com` |
| Owner | `nhtquangforwork@gmail.com` |
| Staff | `demonlord29082004@gmail.com` |

> Admin và Owner yêu cầu **bật 2FA** khi đăng nhập lần đầu (OTP gửi qua email).

---

## 10. Kiểm tra sau cài đặt

### Health check API

```bash
curl http://localhost:8001/health
```

Kết quả mong đợi:

```json
{ "status": "ok", ... }
```

### Đăng nhập theo vai trò

| Vai trò | URL sau đăng nhập |
|---------|-------------------|
| Guest | `/` |
| Owner | `/owner` |
| Staff | `/staff` |
| Admin | `/admin` |

### Chạy test tự động (tùy chọn)

```bash
cd server
npm test
```

---

## 11. Xử lý lỗi thường gặp

### `MongoDB connection error`

- Kiểm tra `MONGO_URL` đúng user/password.
- Atlas: IP máy đã được whitelist trong **Network Access**.
- MongoDB local: service đã chạy.

### CORS / cookie / không đăng nhập được

- `FRONTEND_URL` trong `server/.env` phải **trùng** URL bạn mở trên trình duyệt (ví dụ `http://localhost:3000`).
- `VITE_API_URL` phải trỏ đúng backend (`http://localhost:8001/api`).
- Không trộn `localhost` với `127.0.0.1` — chọn một và dùng nhất quán.

### Upload ảnh lỗi

- Kiểm tra ba biến `CLOUDINARY_*` trong `server/.env`.

### Không nhận email OTP / 2FA

- Dùng **App Password**, không dùng mật khẩu Gmail thường.
- Kiểm tra log server: `Email configuration error` hoặc `Email server is ready`.

### VNPay redirect lỗi

- `VNPAY_RETURN_URL` phải trỏ tới backend, không phải frontend.
- Sandbox: dùng thẻ test theo tài liệu VNPay.

### Port đã được sử dụng

- Đổi `PORT` trong `server/.env` và cập nhật `VITE_API_URL` tương ứng.
- Hoặc tắt process đang chiếm cổng 8001 / 3000.

---

## Tóm tắt nhanh

```bash
# 1. Cấu hình env
cd server && cp .env.example .env    # chỉnh MONGO_URL, JWT_SECRET, Cloudinary, Email...
cd ../client && cp .env.example .env # VITE_API_URL=http://localhost:8001/api

# 2. Cài package
cd ../server && npm install
cd ../client && npm install

# 3. Seed DB (terminal mới, sau khi .env đã sẵn sàng)
cd server && npm run db:seed

# 4. Chạy (2 terminal)
cd server && npm run dev    # :8001
cd client && npm run dev    # :3000
```
