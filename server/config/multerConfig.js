const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { ensurePrivateDir } = require('../services/media/sensitiveMedia');

// Kiểm tra xem có cấu hình Cloudinary không
const hasCloudinaryConfig = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

let hotelStorage, hotelPhotosAndQrUploadStorage, roomStorage, paymentProofStorage, idCardStorage;

if (hasCloudinaryConfig) {
  // Ảnh KS/phòng: Cloudinary public; minh chứng/CCCD: Cloudinary authenticated
  const {
    hotelStorage: cloudinaryHotelStorage,
    hotelPhotosAndQrCloudinaryStorage,
    roomStorage: cloudinaryRoomStorage,
    paymentProofStorage: cloudinaryPaymentProofStorage,
    idCardStorage: cloudinaryIdCardStorage
  } = require('./cloudinaryConfig');
  hotelStorage = cloudinaryHotelStorage;
  hotelPhotosAndQrUploadStorage = hotelPhotosAndQrCloudinaryStorage;
  roomStorage = cloudinaryRoomStorage;
  paymentProofStorage = cloudinaryPaymentProofStorage;
  idCardStorage = cloudinaryIdCardStorage;
  console.log('✅ Sử dụng Cloudinary (public: KS/phòng | private: minh chứng/CCCD)');
} else {
  // Fallback local: KS/phòng → public-uploads (static); nhạy cảm → private-uploads (không static)
  console.log('⚠️  Chưa có cấu hình Cloudinary, dùng local (public-uploads + private-uploads)');
  
  const createUploadDirs = () => {
    const dirs = ['public-uploads/hotels', 'public-uploads/hotel-qr', 'public-uploads/rooms'];
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
    ensurePrivateDir('payment-proofs');
    ensurePrivateDir('id-cards');
  };

  createUploadDirs();

  const hotelAssetDiskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === 'qrCodeImage') {
        cb(null, path.join(__dirname, '../public-uploads/hotel-qr'));
      } else {
        cb(null, path.join(__dirname, '../public-uploads/hotels'));
      }
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const prefix = file.fieldname === 'qrCodeImage' ? 'hotel-qr-' : 'hotel-';
      cb(null, prefix + uniqueSuffix + path.extname(file.originalname));
    }
  });
  hotelStorage = hotelAssetDiskStorage;
  hotelPhotosAndQrUploadStorage = hotelAssetDiskStorage;

  roomStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../public-uploads/rooms'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  paymentProofStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, ensurePrivateDir('payment-proofs'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'payment-proof-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  idCardStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, ensurePrivateDir('id-cards'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'id-card-' + uniqueSuffix + path.extname(file.originalname));
    }
  });
}

// Filter file ảnh
const imageFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb('Error: Chỉ cho phép tải ảnh (jpeg, jpg, png, gif)!');
};

// Payment proof / CCCD allows webp as well
const paymentProofFilter = (req, file, cb) => {
  const filetypes = /jpeg|jpg|png|gif|webp/;
  const mimetype = filetypes.test(file.mimetype);
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

  if (mimetype && extname) {
    return cb(null, true);
  }
  cb('Error: Chỉ cho phép tải ảnh minh chứng (jpeg, jpg, png, gif, webp)!');
};

const hotelOrQrImageFilter = (req, file, cb) => {
  if (file.fieldname === 'qrCodeImage') {
    return paymentProofFilter(req, file, cb);
  }
  return imageFilter(req, file, cb);
};

const uploadHotelImages = multer({
  storage: hotelStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array('images', 10);

const uploadHotelPhotosAndQr = multer({
  storage: hotelPhotosAndQrUploadStorage,
  fileFilter: hotelOrQrImageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'qrCodeImage', maxCount: 1 }
]);

const uploadRoomImages = multer({
  storage: roomStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
}).array('images', 10);

const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  fileFilter: paymentProofFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
}).single('proofImage');

const uploadGuestIdImages = multer({
  storage: idCardStorage,
  fileFilter: paymentProofFilter,
  limits: { fileSize: 8 * 1024 * 1024 }
}).fields([
  { name: 'idImageFront', maxCount: 1 },
  { name: 'idImageBack', maxCount: 1 },
]);

/** Cho phép JSON hoặc multipart khi tạo booking / cập nhật profile (ảnh CCCD 2 mặt). */
const optionalGuestIdImageUpload = (req, res, next) => {
  const contentType = String(req.headers['content-type'] || '');
  if (contentType.includes('multipart/form-data')) {
    return uploadGuestIdImages(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          message: err.message || err.toString() || 'Lỗi tải ảnh CCCD'
        });
      }
      next();
    });
  }
  next();
};

module.exports = {
  uploadHotelImages,
  uploadHotelPhotosAndQr,
  uploadRoomImages,
  uploadPaymentProof,
  uploadGuestIdImages,
  optionalGuestIdImageUpload,
  hasCloudinaryConfig
};
