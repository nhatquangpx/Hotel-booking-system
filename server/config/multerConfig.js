const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ ảnh
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Đường dẫn đến thư mục uploads/hotels trong thư mục gốc của server
    cb(null, path.join(__dirname, '../uploads/hotels')); 
  },
  filename: function (req, file, cb) {
    // Đặt tên file là: fieldname-timestamp.ext
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Khởi tạo multer middleware
const upload = multer({
  storage: storage,
  // Tùy chọn giới hạn kích thước file, loại file, v.v.
  limits: { fileSize: 1024 * 1024 * 5 }, // Giới hạn 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());

    if (mimetype && extname) {
      return cb(null, true);
    }
    cb('Error: Chỉ cho phép tải ảnh (jpeg, jpg, png, gif)!');
  }
});

module.exports = upload; 