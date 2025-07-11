const mongoose = require('mongoose');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Full name is required"],
      trim: true,
    },
    email: {
      type: String,
      unique: true,
      required: [true, "Email is required"],
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: 6,
    },
    profilePic: {
      type: String,
      default: "", // ✅ Cloudinary secure_url will be stored here
    },
    role: {
      type: String,
      enum: ["GENERAL", "ADMIN"], // ✅ restrict role to allowed values
      default: "GENERAL",
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Optional: email index for better query performance
userSchema.index({ email: 1 });

const userModel = mongoose.model("User", userSchema);

module.exports = userModel;
