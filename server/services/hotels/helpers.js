const { hasCloudinaryConfig } = require("../../config/multerConfig");
const { resolveEffectiveQrConfig } = require("../payments/qrConfig");
const { isVnpayConfigComplete } = require("./paymentConfig");
const { normalizeRefundMinDaysBeforeCheckIn } = require("../bookings/core");

function isQrConfigComplete(qr) {
  return Boolean(
    String(qr?.accountName || "").trim() &&
      String(qr?.accountNumber || "").trim() &&
      String(qr?.bankName || "").trim() &&
      String(qr?.qrImageUrl || "").trim()
  );
}

function resolvePoliciesRefundMinDaysBeforeCheckIn(body, prevVal) {
  const fromBracket = body["policies[refundMinDaysBeforeCheckIn]"];
  const fromObject = body.policies?.refundMinDaysBeforeCheckIn;
  const hasBracket = fromBracket !== undefined && fromBracket !== null && fromBracket !== "";
  const hasObject = fromObject !== undefined && fromObject !== null && fromObject !== "";
  const raw = hasBracket ? fromBracket : hasObject ? fromObject : undefined;
  if (raw === undefined || raw === null || raw === "") {
    return normalizeRefundMinDaysBeforeCheckIn(prevVal);
  }
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) {
    return normalizeRefundMinDaysBeforeCheckIn(prevVal);
  }
  return normalizeRefundMinDaysBeforeCheckIn(raw);
}

function resolveQrTextFields(body = {}, fallback = {}) {
  const fromBracket = {
    accountName: body["paymentConfig[qr][accountName]"],
    accountNumber: body["paymentConfig[qr][accountNumber]"],
    bankName: body["paymentConfig[qr][bankName]"],
  };
  const fromObject = body.paymentConfig?.qr || {};

  return {
    accountName:
      fromBracket.accountName !== undefined
        ? fromBracket.accountName
        : fromObject.accountName !== undefined
          ? fromObject.accountName
          : fallback.accountName,
    accountNumber:
      fromBracket.accountNumber !== undefined
        ? fromBracket.accountNumber
        : fromObject.accountNumber !== undefined
          ? fromObject.accountNumber
          : fallback.accountNumber,
    bankName:
      fromBracket.bankName !== undefined
        ? fromBracket.bankName
        : fromObject.bankName !== undefined
          ? fromObject.bankName
          : fallback.bankName,
  };
}

function resolveVnpayFields(body = {}, fallback = {}) {
  const fromBracket = {
    tmnCode: body["paymentConfig[vnpay][tmnCode]"],
    secureSecret: body["paymentConfig[vnpay][secureSecret]"],
  };
  const fromObject = body.paymentConfig?.vnpay || {};

  return {
    tmnCode:
      fromBracket.tmnCode !== undefined
        ? fromBracket.tmnCode
        : fromObject.tmnCode !== undefined
          ? fromObject.tmnCode
          : fallback.tmnCode,
    secureSecret:
      fromBracket.secureSecret !== undefined
        ? fromBracket.secureSecret
        : fromObject.secureSecret !== undefined
          ? fromObject.secureSecret
          : fallback.secureSecret,
  };
}

function shapeVnpayForApiResponse(vnpay) {
  if (!vnpay) return undefined;
  const plain = vnpay.toObject ? vnpay.toObject() : { ...vnpay };
  return {
    tmnCode: String(plain.tmnCode || "").trim(),
    isConfigured: isVnpayConfigComplete(plain),
  };
}

function sanitizeHotelPaymentConfigResponse(hotel, { guestBookingQr = false } = {}) {
  const plain = hotel.toObject ? hotel.toObject() : { ...hotel };
  if (!plain.paymentConfig) return plain;
  plain.paymentConfig = { ...plain.paymentConfig };
  if (guestBookingQr) {
    plain.paymentConfig.qr = resolveEffectiveQrConfig(plain.paymentConfig.qr || {});
  }
  if (plain.paymentConfig.vnpay) {
    plain.paymentConfig.vnpay = shapeVnpayForApiResponse(plain.paymentConfig.vnpay);
  }
  return plain;
}

function applyGuestHotelPayloadSanitize(req, payload) {
  if (req.baseUrl !== "/api/guest" || !payload || typeof payload !== "object") {
    return payload;
  }
  const out = { ...payload };
  delete out.maintenanceContactEmail;
  return out;
}

const MAINTENANCE_CONTACT_EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getHotelImageFiles(req) {
  if (!req.files) return [];
  if (Array.isArray(req.files)) return req.files;
  return req.files.images || [];
}

function getQrUploadFile(req) {
  if (!req.files || Array.isArray(req.files)) return null;
  const arr = req.files.qrCodeImage;
  return arr && arr[0] ? arr[0] : null;
}

function resolveHotelUploadedImageUrl(file) {
  if (!file) return "";
  if (hasCloudinaryConfig) {
    return file.secure_url || file.url || file.path || "";
  }
  if (file.fieldname === "qrCodeImage") {
    return `/public-uploads/hotel-qr/${file.filename}`;
  }
  return `/public-uploads/hotels/${file.filename}`;
}

function isGuestHotelByIdRequest(req) {
  return req.baseUrl === "/api/guest" && /^\/hotels\/[^/]+$/.test(req.path || "");
}

function shouldExposePaymentConfig(req) {
  if (req.baseUrl === "/api/owner" || req.baseUrl === "/api/admin") {
    return true;
  }
  if (isGuestHotelByIdRequest(req)) {
    return (
      req.query.forBooking === "true" &&
      req.user &&
      req.user.role === "guest"
    );
  }
  return false;
}

module.exports = {
  isQrConfigComplete,
  resolvePoliciesRefundMinDaysBeforeCheckIn,
  resolveQrTextFields,
  resolveVnpayFields,
  shapeVnpayForApiResponse,
  sanitizeHotelPaymentConfigResponse,
  applyGuestHotelPayloadSanitize,
  MAINTENANCE_CONTACT_EMAIL_REGEX,
  getHotelImageFiles,
  getQrUploadFile,
  resolveHotelUploadedImageUrl,
  isGuestHotelByIdRequest,
  shouldExposePaymentConfig,
};
