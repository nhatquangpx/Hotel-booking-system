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
    role: {
      type: String,
      enum: ["guest", "admin", "owner"],
      default: "guest"
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active"
    },
    twoFactorAuth: {
      enabled: {
        type: Boolean,
        default: false
      },
      secret: {
        type: String,
        default: null
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
