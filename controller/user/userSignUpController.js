const bcrypt = require('bcryptjs');
const userModel = require("../../models/userModel");
const { uploadImageToCloudinary } = require("./uploadController");
const crypto = require('crypto');
const UserOTP = require('../../models/userOTPModel');
const { Resend } = require('resend');

// ✅ Resend Configuration
const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ Send OTP via Resend
async function sendOTP(email) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min

  await UserOTP.findOneAndUpdate(
    { email },
    { otp, expiresAt },
    { upsert: true, new: true }
  );

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #4F46E5;">Verify Your Email</h2>
      <p>Your verification code is:</p>
      <h1 style="font-size: 2.5rem; letter-spacing: 0.5rem; color: #4F46E5;">
        ${otp}
      </h1>
      <p>This code will expire in 15 minutes.</p>
      <p>If you didn't request this, please ignore this email.</p>
    </div>
  `;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Numan Mirza <onboarding@resend.dev>', // Replace if custom domain verified
      to: [email],
      subject: 'Your Verification Code',
      html,
    });

    if (error) {
      console.error("Resend error:", error);
      throw new Error("Failed to send OTP");
    }

    return true;
  } catch (err) {
    console.error("Resend error:", err);
    throw err;
  }
}

// ✅ Verify OTP logic
async function verifyOTP(email, otp) {
  const otpRecord = await UserOTP.findOne({ email });

  if (!otpRecord) throw new Error("No OTP requested for this email");
  if (otpRecord.expiresAt < new Date()) throw new Error("OTP has expired");
  if (otpRecord.otp !== otp) throw new Error("Invalid OTP");

  await UserOTP.deleteOne({ email });
  return true;
}

// ✅ Signup Controller
async function userSignUpController(req, res) {
  try {
    const { email, password, name } = req.body;
    const fileBuffer = req.file?.buffer;

    if (!email || !password || !name) {
      return res.status(400).json({
        success: false,
        error: true,
        message: "Name, email and password are required.",
      });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: true,
        message: "User already exists with this email.",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    if (!hashPassword) throw new Error("Password hashing failed");

    let profilePicUrl = "";
    if (fileBuffer) {
      try {
        const result = await uploadImageToCloudinary(fileBuffer);
        profilePicUrl = result?.secure_url || "";
      } catch (cloudError) {
        console.error("Cloudinary upload error:", cloudError);
        return res.status(500).json({
          success: false,
          error: true,
          message: "Image upload failed. Please try again.",
        });
      }
    }

    const newUser = new userModel({
      email,
      name,
      password: hashPassword,
      profilePic: profilePicUrl,
      role: "GENERAL",
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      error: false,
      message: "User created successfully.",
      data: {
        email: newUser.email,
        name: newUser.name,
        profilePic: newUser.profilePic,
        role: newUser.role,
        _id: newUser._id,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({
      success: false,
      error: true,
      message: err.message || "Internal Server Error",
    });
  }
}

// ✅ OTP Send API Controller
async function sendOTPController(req, res) {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required"
      });
    }

    await sendOTP(email);

    res.json({
      success: true,
      message: "OTP sent successfully"
    });
  } catch (error) {
    console.error("Send OTP error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to send OTP"
    });
  }
}

// ✅ OTP Verify API Controller
async function verifyOTPController(req, res) {
  try {
    const { email, otp } = req.body;
    await verifyOTP(email, otp);

    res.json({
      success: true,
      message: "OTP verified successfully"
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    res.status(400).json({
      success: false,
      message: error.message || "Failed to verify OTP"
    });
  }
}

module.exports = {
  sendOTPController,
  verifyOTPController,
  userSignUpController
};
