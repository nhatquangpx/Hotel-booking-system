const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// Cấu hình Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Storage cho hotels
const hotelStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    return {
      folder: 'hotel-booking/hotels',
      allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
      transformation: [
        { width: 1000, height: 667, crop: 'limit' },
        { quality: 'auto' }
      ],
      public_id: `hotel-${Date.now()}-${Math.round(Math.random() * 1E9)}`
    };
  }
});

// Storage cho rooms
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

module.exports = {
  cloudinary,
  hotelStorage,
  roomStorage
};

