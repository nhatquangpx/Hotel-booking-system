const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: true,
      minlength: 6
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    /** Số CCCD/CMND — chỉ dùng cho guest; snapshot sang Booking khi đặt phòng */
    idNumber: {
      type: String,
      trim: true,
    },
    /**
     * Ảnh CCCD mặt trước/sau (private: `cld:authenticated:` / `local:private:`).
     * Chỉ guest; không public URL.
     */
    idImageFrontUrl: {
      type: String,
    },
    idImageBackUrl: {
      type: String,
    },
    role: {
      type: String,
      enum: ["guest", "admin", "owner", "staff"],
      default: "guest"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    /** Hết hạn vô hiệu hóa tạm thời; null = không thời hạn (chỉ khi status=inactive) */
    inactiveUntil: {
      type: Date,
      default: null,
    },
    inactiveReason: {
      type: String,
      trim: true,
      default: "",
    },
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false
      },
      backupCodes: [{
        code: String,
        used: {
          type: Boolean,
          default: false
        },
        usedAt: Date
      }]
    },
    temp2FAToken: {
      type: String,
      default: null
    },
    temp2FAExpires: {
      type: Date,
      default: null
    },
    refreshTokenHash: {
      type: String,
      default: null,
      select: false,
    },
    refreshTokenExpires: {
      type: Date,
      default: null,
      select: false,
    },
    wishlist: {
      type: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Hotel"
        }
      ],
      default: []
    },
    trustedDevices: [{
      deviceId: {
        type: String,
        required: true
      },
      deviceName: {
        type: String,
        default: 'Unknown Device'
      },
      userAgent: String,
      ipAddress: String,
      trustedAt: {
        type: Date,
        default: Date.now
      },
      expiresAt: {
        type: Date,
        required: true
      }
    }]
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
