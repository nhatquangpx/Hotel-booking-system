const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Kiểm tra xem có cấu hình Cloudinary không
const hasCloudinaryConfig = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

let hotelStorage, hotelPhotosAndQrUploadStorage, roomStorage, paymentProofStorage;

if (hasCloudinaryConfig) {
  // Sử dụng Cloudinary cho production
  const {
    hotelStorage: cloudinaryHotelStorage,
    hotelPhotosAndQrCloudinaryStorage,
    roomStorage: cloudinaryRoomStorage,
    paymentProofStorage: cloudinaryPaymentProofStorage
  } = require('./cloudinaryConfig');
  hotelStorage = cloudinaryHotelStorage;
  hotelPhotosAndQrUploadStorage = hotelPhotosAndQrCloudinaryStorage;
  roomStorage = cloudinaryRoomStorage;
  paymentProofStorage = cloudinaryPaymentProofStorage;
  console.log('✅ Sử dụng Cloudinary để lưu trữ ảnh');
} else {
  // Fallback về local storage cho development (nếu chưa có Cloudinary config)
  console.log('⚠️  Chưa có cấu hình Cloudinary, sử dụng local storage');
  
  // Tạo thư mục uploads nếu chưa tồn tại
  const createUploadDirs = () => {
    const dirs = ['uploads/hotels', 'uploads/hotel-qr', 'uploads/rooms', 'uploads/payment-proofs'];
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  };

  createUploadDirs();

  const hotelAssetDiskStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      if (file.fieldname === 'qrCodeImage') {
        cb(null, path.join(__dirname, '../uploads/hotel-qr'));
      } else {
        cb(null, path.join(__dirname, '../uploads/hotels'));
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
      cb(null, path.join(__dirname, '../uploads/rooms'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  paymentProofStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/payment-proofs'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'payment-proof-' + uniqueSuffix + path.extname(file.originalname));
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

// Payment proof allows webp as well (aligned with Cloudinary allowed formats).
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

// Upload middleware cho hotels
const uploadHotelImages = multer({
  storage: hotelStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).array('images', 10); // cho phép tối đa 10 ảnh

// Form khách sạn: tối đa 10 ảnh `images` + tối đa 1 `qrCodeImage` (cùng middleware, storage phân loại theo fieldname)
const uploadHotelPhotosAndQr = multer({
  storage: hotelPhotosAndQrUploadStorage,
  fileFilter: hotelOrQrImageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).fields([
  { name: 'images', maxCount: 10 },
  { name: 'qrCodeImage', maxCount: 1 }
]);

// Upload middleware cho rooms
const uploadRoomImages = multer({
  storage: roomStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).array('images', 10); // cho phép tối đa 10 ảnh

const uploadPaymentProof = multer({
  storage: paymentProofStorage,
  fileFilter: paymentProofFilter,
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB
}).single('proofImage');

module.exports = {
  uploadHotelImages,
  uploadHotelPhotosAndQr,
  uploadRoomImages,
  uploadPaymentProof,
  hasCloudinaryConfig
}; 