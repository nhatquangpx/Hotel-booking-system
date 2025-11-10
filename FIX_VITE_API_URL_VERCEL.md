# 🔧 Fix: Frontend vẫn kết nối với localhost

## 🚨 Vấn đề

Frontend vẫn đang kết nối với `localhost:8001` thay vì Railway backend, mặc dù đã set `VITE_API_URL` trong Vercel.

## 🔍 Nguyên nhân

### 1. VITE_API_URL chưa được set trong Vercel
- Environment variable chưa được thêm
- Hoặc được thêm nhưng chưa save

### 2. VITE_API_URL đã set nhưng chưa rebuild
- Vercel cần rebuild để embed env vars vào code
- Env vars được embed vào code tại build time, không phải runtime

### 3. VITE_API_URL format sai
- Thiếu `https://`
- Có `/` ở cuối
- Hoặc relative URL thay vì absolute URL

## ✅ Giải pháp

### Bước 1: Kiểm tra VITE_API_URL trong Vercel

1. **Vào Vercel Dashboard:**
   - Truy cập [vercel.com](https://vercel.com)
   - Chọn project frontend

2. **Vào Settings → Environment Variables:**
   - Click vào project
   - Vào tab **Settings**
   - Scroll xuống **Environment Variables**

3. **Kiểm tra:**
   - Có biến `VITE_API_URL` không?
   - Giá trị có đúng không?
   - Đã chọn environments (Production, Preview, Development) chưa?

### Bước 2: Set VITE_API_URL đúng cách

1. **Nếu chưa có, thêm mới:**
   - Click **Add New**
   - **Key:** `VITE_API_URL`
   - **Value:** `https://loyal-blessing-production.up.railway.app/api`
   - **Environment:** Chọn tất cả (Production, Preview, Development)
   - Click **Save**

2. **Nếu đã có, kiểm tra giá trị:**
   - **Đúng:** `https://loyal-blessing-production.up.railway.app/api`
   - **Sai:** `loyal-blessing-production.up.railway.app/api` (thiếu https://)
   - **Sai:** `https://loyal-blessing-production.up.railway.app/api/` (có / ở cuối)

3. **Sửa nếu cần:**
   - Click vào biến
   - Sửa giá trị
   - Click **Save**

### Bước 3: Redeploy Frontend

**QUAN TRỌNG:** Vercel cần rebuild để embed env vars vào code!

1. **Vào Deployments:**
   - Click vào project
   - Vào tab **Deployments**

2. **Redeploy:**
   - Tìm deployment mới nhất
   - Click vào **...** (3 dots)
   - Click **Redeploy**
   - Hoặc tạo deployment mới bằng cách push code mới

3. **Đợi deploy hoàn tất:**
   - Thường mất 2-5 phút
   - Xem logs để đảm bảo build thành công

### Bước 4: Kiểm tra sau khi deploy

1. **Mở Browser Console (F12):**
   - Xem logs: `🔍 API Configuration`
   - `VITE_API_URL` phải là: `https://loyal-blessing-production.up.railway.app/api`
   - `Using URL` phải là: `https://loyal-blessing-production.up.railway.app/api`

2. **Nếu vẫn thấy `localhost:8001`:**
   - `VITE_API_URL` vẫn là `NOT SET`
   - Cần kiểm tra lại Vercel env vars
   - Cần redeploy lại

## 🔍 Debug

### Kiểm tra trong Browser Console

**Mở Browser Console và chạy:**
```javascript
console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
```

**Expected:**
- `https://loyal-blessing-production.up.railway.app/api`

**Nếu là `undefined`:**
- Env var chưa được set
- Hoặc chưa rebuild

### Kiểm tra Network Tab

1. **F12 → Network tab**
2. **Refresh page**
3. **Tìm request đến `/api/guest/hotels/featured`**
4. **Kiểm tra Request URL:**
   - **Đúng:** `https://loyal-blessing-production.up.railway.app/api/guest/hotels/featured`
   - **Sai:** `http://localhost:8001/api/guest/hotels/featured`

### Kiểm tra Vercel Build Logs

1. **Vào Vercel Dashboard → Deployments**
2. **Click vào deployment mới nhất**
3. **Xem Build Logs**
4. **Kiểm tra:**
   - Build có thành công không?
   - Có errors không?
   - Env vars có được load không?

## 💡 Lưu ý quan trọng

### Vite Environment Variables

**Vite chỉ embed env vars vào code tại BUILD TIME, không phải RUNTIME!**

Điều này có nghĩa:
- ✅ Env vars được embed vào code khi build
- ✅ Mỗi lần thay đổi env vars, cần rebuild
- ❌ Không thể thay đổi env vars mà không rebuild

### Vercel Environment Variables

**Vercel chỉ apply env vars khi BUILD, không phải khi RUNTIME!**

Điều này có nghĩa:
- ✅ Env vars được inject vào build process
- ✅ Mỗi lần thay đổi env vars, cần redeploy
- ❌ Không thể thay đổi env vars mà không redeploy

## 📋 Checklist

- [ ] Đã set `VITE_API_URL` trong Vercel
- [ ] Giá trị có `https://` ở đầu
- [ ] Giá trị không có `/` ở cuối
- [ ] Đã chọn tất cả environments (Production, Preview, Development)
- [ ] Đã save environment variables
- [ ] Đã redeploy frontend (QUAN TRỌNG!)
- [ ] Đã đợi deploy hoàn tất
- [ ] Đã kiểm tra browser console (logs)
- [ ] Đã kiểm tra Network tab (request URL đúng)
- [ ] Request URL là Railway backend, không phải localhost

## 🎯 Expected Result

### Sau khi fix:

**Browser Console:**
```
🔍 API Configuration:
  VITE_API_URL: https://loyal-blessing-production.up.railway.app/api
  Using URL: https://loyal-blessing-production.up.railway.app/api
  Environment: production
✅ Using API URL: https://loyal-blessing-production.up.railway.app/api
✅ Axios baseURL configured: https://loyal-blessing-production.up.railway.app/api
```

**Network Tab:**
- Request URL: `https://loyal-blessing-production.up.railway.app/api/guest/hotels/featured`
- Status: 200 OK
- Response: Data hoặc empty array

## 🐛 Troubleshooting

### Vẫn thấy localhost sau khi set và redeploy

1. **Kiểm tra env var:**
   - Vào Vercel Dashboard
   - Settings → Environment Variables
   - Xem giá trị có đúng không

2. **Kiểm tra build logs:**
   - Vào Deployments
   - Xem build logs
   - Kiểm tra có errors không

3. **Clear browser cache:**
   - Hard refresh: `Ctrl+Shift+R`
   - Clear cache trong browser settings
   - Test với Incognito mode

4. **Kiểm tra deployment:**
   - Đảm bảo đang xem deployment mới nhất
   - Đảm bảo deployment đã hoàn tất

### Env var không được apply

1. **Kiểm tra spelling:**
   - Đảm bảo tên biến đúng: `VITE_API_URL` (không phải `VITE_API` hay `API_URL`)

2. **Kiểm tra environment:**
   - Đảm bảo đã chọn đúng environment (Production, Preview)

3. **Redeploy:**
   - Vercel cần redeploy để apply env vars
   - Đợi deploy hoàn tất

### Build fails

1. **Kiểm tra build logs:**
   - Xem errors trong build logs
   - Fix errors nếu có

2. **Kiểm tra code:**
   - Đảm bảo code không có syntax errors
   - Đảm bảo dependencies được install đúng

## ✅ Summary

**Vấn đề:** Frontend vẫn kết nối với localhost

**Nguyên nhân:** `VITE_API_URL` chưa được set hoặc chưa rebuild

**Giải pháp:**
1. Set `VITE_API_URL` trong Vercel
2. Redeploy frontend (QUAN TRỌNG!)
3. Kiểm tra lại

**Lưu ý:** Vite chỉ embed env vars vào code tại BUILD TIME, nên cần rebuild sau mỗi lần thay đổi env vars!

