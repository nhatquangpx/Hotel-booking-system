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
    }
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
