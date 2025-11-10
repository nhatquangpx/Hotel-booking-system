# 🔧 Fix: VITE_API_URL thiếu https://

## 🚨 Vấn đề

`VITE_API_URL` đã được set trong Vercel, nhưng **thiếu `https://` ở đầu**.

**Giá trị hiện tại:**
```
loyal-blessing-production.up.railway.app/api
```

**Giá trị đúng:**
```
https://loyal-blessing-production.up.railway.app/api
```

## ✅ Giải pháp

### Bước 1: Sửa VITE_API_URL trong Vercel

1. **Vào Vercel Dashboard:**
   - Truy cập [vercel.com](https://vercel.com)
   - Chọn project frontend

2. **Vào Settings → Environment Variables:**
   - Click vào project
   - Vào tab **Settings**
   - Scroll xuống **Environment Variables**

3. **Tìm và sửa `VITE_API_URL`:**
   - Tìm biến `VITE_API_URL`
   - Click vào biến để edit
   - **Sửa giá trị từ:**
     ```
     loyal-blessing-production.up.railway.app/api
     ```
   - **Thành:**
     ```
     https://loyal-blessing-production.up.railway.app/api
     ```
   - **Lưu ý:** Thêm `https://` ở đầu!

4. **Save:**
   - Click **Save** hoặc **Update**

### Bước 2: Redeploy Frontend

**⚠️ QUAN TRỌNG: Sau khi sửa env var, BẮT BUỘC phải redeploy!**

1. **Vào Deployments:**
   - Click vào project
   - Vào tab **Deployments**

2. **Redeploy:**
   - Tìm deployment mới nhất
   - Click vào **...** (3 dots)
   - Click **Redeploy**
   - Hoặc tạo deployment mới bằng cách push code

3. **Đợi deploy hoàn tất:**
   - Thường mất 2-5 phút
   - Xem build logs để đảm bảo build thành công

### Bước 3: Kiểm tra sau khi Deploy

1. **Mở Browser Console (F12):**
   - Xem logs: `🔍 API Configuration`
   - `VITE_API_URL` phải là: `https://loyal-blessing-production.up.railway.app/api`
   - Không còn error: `❌ VITE_API_URL must be an absolute URL`

2. **Kiểm tra Network Tab:**
   - F12 → Network tab
   - Refresh page
   - Tìm request đến `/api/guest/hotels/featured`
   - Request URL phải là: `https://loyal-blessing-production.up.railway.app/api/guest/hotels/featured`
   - Status: 200 OK (thay vì error)

## 🎯 Expected Result

### Sau khi sửa và redeploy:

**Browser Console:**
```
🔍 API Configuration:
  VITE_API_URL: https://loyal-blessing-production.up.railway.app/api
  Using URL: https://loyal-blessing-production.up.railway.app/api
  Environment: production
✅ Using API URL: https://loyal-blessing-production.up.railway.app/api
✅ Axios baseURL configured: https://loyal-blessing-production.up.railway.app/api
```

**Không còn errors:**
- ❌ Không còn: `❌ VITE_API_URL must be an absolute URL`
- ✅ Thấy: `✅ Using API URL: https://...`

**Network Tab:**
- Request URL: `https://loyal-blessing-production.up.railway.app/api/guest/hotels/featured`
- Status: 200 OK
- Response: Data hoặc empty array

## 💡 Lưu ý

### VITE_API_URL Format

✅ **Đúng:**
```
https://loyal-blessing-production.up.railway.app/api
```

❌ **Sai:**
```
loyal-blessing-production.up.railway.app/api  # Thiếu https://
http://loyal-blessing-production.up.railway.app/api  # Dùng http thay vì https
https://loyal-blessing-production.up.railway.app/api/  # Có / ở cuối
```

### Tại sao cần https://?

- **Absolute URL:** Phải có protocol (`http://` hoặc `https://`)
- **Security:** HTTPS đảm bảo kết nối an toàn
- **Browser:** Browser cần protocol để biết cách kết nối

## 📋 Checklist

- [ ] Đã tìm thấy `VITE_API_URL` trong Vercel
- [ ] Đã sửa giá trị: thêm `https://` ở đầu
- [ ] Giá trị đúng: `https://loyal-blessing-production.up.railway.app/api`
- [ ] Đã save environment variable
- [ ] Đã redeploy frontend (QUAN TRỌNG!)
- [ ] Đã đợi deploy hoàn tất
- [ ] Đã kiểm tra browser console (không còn errors)
- [ ] Đã kiểm tra Network tab (request URL đúng)
- [ ] Request URL là Railway backend với https://

## 🐛 Troubleshooting

### Vẫn thấy error sau khi sửa và redeploy

1. **Kiểm tra giá trị:**
   - Vào Vercel Dashboard
   - Settings → Environment Variables
   - Xem giá trị `VITE_API_URL` có đúng không
   - Đảm bảo có `https://` ở đầu

2. **Kiểm tra deployment:**
   - Đảm bảo đang xem deployment mới nhất
   - Đảm bảo deployment đã hoàn tất
   - Xem build logs có errors không

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R`
   - Clear cache trong browser settings
   - Test với Incognito mode

### Giá trị không được update

1. **Kiểm tra spelling:**
   - Đảm bảo tên biến đúng: `VITE_API_URL`
   - Không có spaces ở đầu/cuối

2. **Redeploy:**
   - Vercel cần redeploy để apply env vars mới
   - Đợi deploy hoàn tất

## ✅ Summary

**Vấn đề:** `VITE_API_URL` thiếu `https://` ở đầu

**Giải pháp:**
1. Sửa giá trị trong Vercel: thêm `https://` ở đầu
2. Redeploy frontend
3. Kiểm tra lại

**Lưu ý:** Sau khi sửa env var, cần redeploy để apply!

