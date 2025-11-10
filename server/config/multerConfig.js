const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Kiểm tra xem có cấu hình Cloudinary không
const hasCloudinaryConfig = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

let hotelStorage, roomStorage;

if (hasCloudinaryConfig) {
  // Sử dụng Cloudinary cho production
  const { hotelStorage: cloudinaryHotelStorage, roomStorage: cloudinaryRoomStorage } = require('./cloudinaryConfig');
  hotelStorage = cloudinaryHotelStorage;
  roomStorage = cloudinaryRoomStorage;
  console.log('✅ Sử dụng Cloudinary để lưu trữ ảnh');
} else {
  // Fallback về local storage cho development (nếu chưa có Cloudinary config)
  console.log('⚠️  Chưa có cấu hình Cloudinary, sử dụng local storage');
  
  // Tạo thư mục uploads nếu chưa tồn tại
  const createUploadDirs = () => {
    const dirs = ['uploads/hotels', 'uploads/rooms'];
    dirs.forEach(dir => {
      const fullPath = path.join(__dirname, '..', dir);
      if (!fs.existsSync(fullPath)) {
        fs.mkdirSync(fullPath, { recursive: true });
      }
    });
  };

  createUploadDirs();

  hotelStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/hotels'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'hotel-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  roomStorage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, path.join(__dirname, '../uploads/rooms'));
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, 'room-' + uniqueSuffix + path.extname(file.originalname));
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

// Upload middleware cho hotels
const uploadHotelImages = multer({
  storage: hotelStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).array('images', 10); // cho phép tối đa 10 ảnh

// Upload middleware cho rooms
const uploadRoomImages = multer({
  storage: roomStorage,
  fileFilter: imageFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
}).array('images', 10); // cho phép tối đa 10 ảnh

module.exports = {
  uploadHotelImages,
  uploadRoomImages,
  hasCloudinaryConfig
}; 