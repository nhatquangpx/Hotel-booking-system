const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const buildHotelAssetParams = (file) => {
  const isQr = file?.fieldname === "qrCodeImage";
  return {
    folder: isQr ? "hotel-booking/hotel-qr" : "hotel-booking/hotels",
    allowed_formats: isQr ? ["jpg", "jpeg", "png", "gif", "webp"] : ["jpg", "jpeg", "png", "gif"],
    transformation: isQr
      ? [{ width: 800, height: 800, crop: "limit" }, { quality: "auto" }]
      : [{ width: 1000, height: 667, crop: "limit" }, { quality: "auto" }],
    public_id: isQr
      ? `hotel-qr-${Date.now()}-${Math.round(Math.random() * 1e9)}`
      : `hotel-${Date.now()}-${Math.round(Math.random() * 1e9)}`
  };
};

// Storage dùng chung cho tài nguyên khách sạn (`images` và `qrCodeImage`) — PUBLIC
const hotelAssetStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => buildHotelAssetParams(file)
});

// Storage cho rooms — PUBLIC
const roomStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'hotel-booking/rooms',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [
        { width: 1000, height: 667, crop: 'limit' },
        { quality: 'auto' }
      ],
      public_id: `room-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

// Giữ 2 tên export để code gọi bên ngoài rõ ngữ cảnh sử dụng
const hotelStorage = hotelAssetStorage;
const hotelPhotosAndQrCloudinaryStorage = hotelAssetStorage;

/**
 * Minh chứng thanh toán / hoàn tiền — AUTHENTICATED (không public).
 * Xem ảnh qua signed URL hoặc API có auth.
 */
const paymentProofStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async () => {
    return {
      folder: 'hotel-booking/payment-proofs',
      type: 'authenticated',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1600, height: 1600, crop: 'limit' },
        { quality: 'auto' }
      ],
      public_id: `payment-proof-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

/** Ảnh CCCD — AUTHENTICATED */
const idCardStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async () => {
    return {
      folder: 'hotel-booking/id-cards',
      type: 'authenticated',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
      transformation: [
        { width: 1600, height: 1600, crop: 'limit' },
        { quality: 'auto' }
      ],
      public_id: `id-card-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

module.exports = {
  cloudinary,
  hotelStorage,
  hotelPhotosAndQrCloudinaryStorage,
  roomStorage,
  paymentProofStorage,
  idCardStorage
};
