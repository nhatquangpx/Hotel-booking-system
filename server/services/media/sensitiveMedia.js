const path = require("path");
const fs = require("fs");

const CLOUDINARY_PREFIX = "cld:authenticated:";
const LOCAL_PREFIX = "local:private:";
const PRIVATE_ROOT = path.join(__dirname, "..", "..", "private-uploads");

const hasCloudinaryConfig = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

const MEDIA_KINDS = {
  "qr-proof": "qrPaymentProofUrl",
  "refund-proof": "ownerRefundProofUrl",
  "id-image-front": "guestIdImageFrontUrl",
  "id-image-back": "guestIdImageBackUrl",
};

function ensurePrivateDir(subdir) {
  const full = path.join(PRIVATE_ROOT, subdir);
  if (!fs.existsSync(full)) {
    fs.mkdirSync(full, { recursive: true });
  }
  return full;
}

/**
 * Chuẩn hóa file multer (Cloudinary authenticated hoặc disk private) thành ref lưu DB.
 * Không lưu URL public.
 */
function buildSensitiveMediaRef(file, folder = "payment-proofs") {
  if (!file) return null;

  if (hasCloudinaryConfig) {
    const publicId = file.public_id || file.filename;
    if (publicId && !String(file.path || "").includes(`${path.sep}private-uploads${path.sep}`)) {
      const normalized = String(publicId).replace(/^\/+/, "");
      return `${CLOUDINARY_PREFIX}${normalized}`;
    }
  }

  const filename = file.filename || path.basename(file.path || "");
  if (!filename) return null;
  return `${LOCAL_PREFIX}${folder}/${filename}`;
}

function isSensitiveMediaRef(value) {
  if (!value || typeof value !== "string") return false;
  return (
    value.startsWith(CLOUDINARY_PREFIX) ||
    value.startsWith(LOCAL_PREFIX)
  );
}

function isLegacyPublicMediaUrl(value) {
  if (!value || typeof value !== "string") return false;
  return /^https?:\/\//i.test(value) || value.startsWith("/uploads/") || value.startsWith("/public-uploads/");
}

function hasSensitiveMedia(value) {
  return Boolean(value) && (isSensitiveMediaRef(value) || isLegacyPublicMediaUrl(value));
}

function resolveLocalAbsolutePath(ref) {
  if (!ref?.startsWith(LOCAL_PREFIX)) return null;
  const relative = ref.slice(LOCAL_PREFIX.length).replace(/\\/g, "/");
  if (!relative || relative.includes("..")) return null;
  const absolute = path.join(PRIVATE_ROOT, ...relative.split("/"));
  if (!absolute.startsWith(PRIVATE_ROOT)) return null;
  return absolute;
}

/**
 * Tạo URL tạm (Cloudinary signed / legacy public) — chỉ dùng phía server để proxy.
 */
function createAccessUrl(ref, { expiresInSec = 300 } = {}) {
  if (!ref) return null;

  if (isLegacyPublicMediaUrl(ref)) {
    if (/^https?:\/\//i.test(ref)) return ref;
    const backendBase = process.env.BACKEND_URL || process.env.API_URL || "http://localhost:5000";
    return `${String(backendBase).replace(/\/+$/, "")}${ref.startsWith("/") ? ref : `/${ref}`}`;
  }

  if (ref.startsWith(CLOUDINARY_PREFIX)) {
    const { cloudinary } = require("../../config/cloudinaryConfig");
    const publicId = ref.slice(CLOUDINARY_PREFIX.length);
    return cloudinary.url(publicId, {
      type: "authenticated",
      sign_url: true,
      secure: true,
      resource_type: "image",
    });
  }

  return null;
}

/**
 * Tải ảnh từ URL (Cloudinary signed / legacy) rồi ghi vào response — tránh CORS khi client dùng blob.
 */
async function proxyRemoteImage(res, url) {
  const upstream = await fetch(url);
  if (!upstream.ok) {
    res.status(502).json({ message: "Không tải được ảnh từ kho lưu trữ" });
    return;
  }

  const contentType = upstream.headers.get("content-type") || "image/jpeg";
  if (!String(contentType).startsWith("image/")) {
    res.status(502).json({ message: "Kho lưu trữ trả về dữ liệu không phải ảnh" });
    return;
  }

  const buffer = Buffer.from(await upstream.arrayBuffer());
  res.setHeader("Content-Type", contentType);
  res.setHeader("Cache-Control", "private, no-store");
  res.setHeader("Content-Length", buffer.length);
  res.send(buffer);
}

/**
 * Stream ảnh nhạy cảm ra response (sau khi đã kiểm tra quyền).
 * Cloudinary authenticated: proxy qua server, không redirect (tránh CORS trên client).
 */
async function streamSensitiveMedia(res, ref) {
  if (!ref) {
    res.status(404).json({ message: "Không tìm thấy ảnh" });
    return;
  }

  if (ref.startsWith(LOCAL_PREFIX)) {
    const absolute = resolveLocalAbsolutePath(ref);
    if (!absolute || !fs.existsSync(absolute)) {
      res.status(404).json({ message: "Không tìm thấy file ảnh" });
      return;
    }
    res.setHeader("Cache-Control", "private, no-store");
    return res.sendFile(absolute);
  }

  if (ref.startsWith(CLOUDINARY_PREFIX) || isLegacyPublicMediaUrl(ref)) {
    const url = createAccessUrl(ref, { expiresInSec: 120 });
    if (!url) {
      res.status(404).json({ message: "Không tạo được đường dẫn ảnh" });
      return;
    }
    try {
      await proxyRemoteImage(res, url);
    } catch (err) {
      console.error("proxySensitiveMedia:", err?.message || err);
      if (!res.headersSent) {
        res.status(502).json({ message: "Không tải được ảnh từ kho lưu trữ" });
      }
    }
    return;
  }

  res.status(400).json({ message: "Định dạng ảnh không hợp lệ" });
}

function getMediaField(kind) {
  return MEDIA_KINDS[kind] || null;
}

module.exports = {
  CLOUDINARY_PREFIX,
  LOCAL_PREFIX,
  PRIVATE_ROOT,
  MEDIA_KINDS,
  ensurePrivateDir,
  buildSensitiveMediaRef,
  isSensitiveMediaRef,
  isLegacyPublicMediaUrl,
  hasSensitiveMedia,
  createAccessUrl,
  streamSensitiveMedia,
  getMediaField,
  resolveLocalAbsolutePath,
};
