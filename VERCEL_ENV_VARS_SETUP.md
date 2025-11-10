# 🔧 Hướng dẫn Set VITE_API_URL trong Vercel

## ⚠️ QUAN TRỌNG

**Vite chỉ embed environment variables vào code tại BUILD TIME!**

Điều này có nghĩa:
- ✅ Env vars được embed vào code khi build
- ✅ Mỗi lần thay đổi env vars, **CẦN REDEPLOY** để rebuild
- ❌ Không thể thay đổi env vars mà không rebuild

## 📋 Các bước Set VITE_API_URL

### Bước 1: Vào Vercel Dashboard

1. Truy cập [vercel.com](https://vercel.com)
2. Đăng nhập vào account
3. Chọn project frontend của bạn

### Bước 2: Vào Settings → Environment Variables

1. Click vào project
2. Vào tab **Settings** (sidebar trái)
3. Scroll xuống phần **Environment Variables**

### Bước 3: Thêm Environment Variable

1. Click **Add New** hoặc **Add**
2. Điền thông tin:
   - **Key:** `VITE_API_URL`
   - **Value:** `https://loyal-blessing-production.up.railway.app/api`
   - **Environment:** 
     - ✅ Production
     - ✅ Preview
     - ✅ Development
     - (Chọn tất cả để đảm bảo hoạt động ở mọi environment)
3. Click **Save**

### Bước 4: Redeploy (QUAN TRỌNG!)

**⚠️ SAU KHI SET ENV VAR, BẮT BUỘC PHẢI REDEPLOY!**

1. Vào tab **Deployments** (sidebar trái)
2. Tìm deployment mới nhất
3. Click vào **...** (3 dots) bên cạnh deployment
4. Click **Redeploy**
5. Hoặc tạo deployment mới bằng cách:
   - Push code mới lên GitHub
   - Hoặc click **Redeploy** trong Vercel

### Bước 5: Đợi Deploy hoàn tất

1. Xem build logs trong Vercel
2. Đợi build hoàn tất (thường 2-5 phút)
3. Kiểm tra deployment status: **Ready** ✅

## 🔍 Kiểm tra sau khi Deploy

### 1. Kiểm tra Browser Console

1. Mở frontend trên Vercel
2. F12 → Console tab
3. Xem logs:
   ```
   🔍 API Configuration:
     VITE_API_URL: https://loyal-blessing-production.up.railway.app/api
     Using URL: https://loyal-blessing-production.up.railway.app/api
     Environment: production
   ✅ Using API URL: https://loyal-blessing-production.up.railway.app/api
   ✅ Axios baseURL configured: https://loyal-blessing-production.up.railway.app/api
   ```

**Nếu thấy `VITE_API_URL: NOT SET`:**
- Env var chưa được set
- Hoặc chưa rebuild

### 2. Kiểm tra Network Tab

1. F12 → Network tab
2. Refresh page
3. Tìm request đến `/api/guest/hotels/featured`
4. Kiểm tra Request URL:
   - **Đúng:** `https://loyal-blessing-production.up.railway.app/api/guest/hotels/featured`
   - **Sai:** `http://localhost:8001/api/guest/hotels/featured`

### 3. Kiểm tra Vercel Build Logs

1. Vào Vercel Dashboard → Deployments
2. Click vào deployment mới nhất
3. Xem Build Logs
4. Kiểm tra:
   - Build có thành công không?
   - Có errors không?
   - Env vars có được load không?

## 🎯 Expected Result

### Sau khi set và redeploy:

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

## 💡 Lưu ý

### VITE_API_URL Format

✅ **Đúng:**
```
VITE_API_URL=https://loyal-blessing-production.up.railway.app/api
```

❌ **Sai:**
```
VITE_API_URL=loyal-blessing-production.up.railway.app/api  # Thiếu https://
VITE_API_URL=https://loyal-blessing-production.up.railway.app/api/  # Có / ở cuối
VITE_API_URL=/loyal-blessing-production.up.railway.app/api  # Relative URL
```

### Vercel Environment Variables

- **Production:** Áp dụng cho production deployments
- **Preview:** Áp dụng cho preview deployments (PR, branches)
- **Development:** Áp dụng cho development (ít dùng)

**Nên chọn tất cả** để đảm bảo hoạt động ở mọi environment.

## 🐛 Troubleshooting

### Vẫn thấy localhost sau khi set và redeploy

1. **Kiểm tra env var:**
   - Vào Vercel Dashboard
   - Settings → Environment Variables
   - Xem có `VITE_API_URL` không
   - Giá trị có đúng không

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

## 📝 Checklist

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

## ✅ Summary

**Vấn đề:** Frontend vẫn kết nối với localhost

**Nguyên nhân:** `VITE_API_URL` chưa được set hoặc chưa rebuild

**Giải pháp:**
1. Set `VITE_API_URL` trong Vercel
2. **Redeploy frontend (QUAN TRỌNG!)**
3. Kiểm tra lại

**Lưu ý:** Vite chỉ embed env vars vào code tại BUILD TIME, nên cần rebuild sau mỗi lần thay đổi env vars!

