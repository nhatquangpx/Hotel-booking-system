# Vercel Deployment Guide

## Vấn đề
Vercel đang tự động detect framework và nghĩ rằng đây là Remix project, dẫn đến lỗi `@remix-run/dev`.

## Giải pháp (Khuyến nghị)

### Cách 1: Cấu hình Root Directory trong Vercel Dashboard (Được khuyến nghị)

1. Truy cập [Vercel Dashboard](https://vercel.com/dashboard)
2. Chọn project của bạn
3. Vào **Settings** → **General**
4. Tìm mục **Root Directory**
5. Nhập: `client`
6. Lưu lại
7. Trigger lại deployment

Cách này sẽ đảm bảo Vercel build trực tiếp từ thư mục `client/` mà không cần detect framework từ root.

### Cách 2: Sử dụng file `vercel.json` (Đã cấu hình)

File `vercel.json` đã được cấu hình với:
- `builds`: Chỉ định build từ `client/package.json`
- `@vercel/static-build`: Builder cho static site
- `distDir`: Output directory là `dist`

Tuy nhiên, nếu vẫn gặp lỗi, hãy sử dụng Cách 1.

## Lưu ý

- Không có `package.json` ở root để tránh Vercel detect sai framework
- Tất cả dependencies và build scripts nằm trong `client/package.json`
- Output build sẽ ở `client/dist/`

## Sau khi cấu hình

1. Commit và push các thay đổi:
   ```bash
   git add vercel.json
   git commit -m "Configure Vercel for monorepo"
   git push
   ```

2. Vercel sẽ tự động rebuild với cấu hình mới

