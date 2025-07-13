const bcrypt = require('bcryptjs');
const userModel = require("../../models/userModel");
const { uploadImageToCloudinary } = require("./uploadController");
const crypto = require('crypto');
const UserOTP = require('../../models/userOTPModel');
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);

// ✅ OTP Sender
async function sendOTP(email, name) {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  // ✅ نام DB سے نکالیں اگر نہیں ملا
  if (!name) {
    const user = await userModel.findOne({ email });
    name = user?.fullName || user?.name || user?.username || "User";
  }

  await UserOTP.findOneAndUpdate(
    { email },
    { otp, expiresAt },
    { upsert: true, new: true }
  );

  const html = `
  <div style="max-width:600px;margin:0 auto;background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 15px 40px rgba(0,0,0,0.15);font-family:'Segoe UI',Tahoma,sans-serif;">
    <div style="background:linear-gradient(135deg,#4F46E5,#7C3AED);padding:40px 30px;text-align:center;position:relative;color:#fff;">
      <div style="position:absolute;top:0;left:0;width:100%;height:100%;z-index:0;background:url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 1440 320%22><path fill=%22%23ffffff%22 fill-opacity=%220.05%22 d=%22M0,160L48,176C96,192,192,224,288,213.3C384,203,480,149,576,133.3C672,117,768,139,864,160C960,181,1056,203,1152,197.3C1248,192,1344,160,1392,144L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z%22></path></svg>');background-size:cover;background-position:center bottom;"></div>

      <div style="position:relative;z-index:2;">
        <div style="display:flex;align-items:center;justify-content:center;gap:15px;margin-bottom:20px;">
          <div style="width:50px;height:50px;background:white;border-radius:12px;display:flex;align-items:center;justify-content:center;color:#4F46E5;font-size:24px;font-weight:700;">
            🔐
          </div>
          <div style="font-size:26px;font-weight:800;">M Numan Akbar</div>
        </div>
        <h1 style="font-size:28px;font-weight:700;margin:10px 0;">Verify Your Email</h1>
        <p style="font-size:16px;line-height:1.6;max-width:500px;margin:0 auto;">Enter the code below to complete your registration.</p>
      </div>
    </div>

    <div style="padding:30px;">
      <p style="color:#4a5568;font-size:16px;margin-bottom:25px;line-height:1.6;">
        Hello,<br>
        Thank you for joining us! To access all features, please verify your email address by using the code below.
      </p>

      <div style="background:#f9fafb;border-radius:16px;padding:25px;text-align:center;margin:30px 0;border:1px solid #e2e8f0;">
        <p style="color:#4a5568;font-size:16px;font-weight:600;">Your verification code:</p>
        <div style="display:flex;justify-content:center;gap:10px;margin:20px 0;flex-wrap:wrap;">
          ${otp.split("").map(d => `<div style="width:50px;height:65px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:700;color:#4F46E5;box-shadow:0 5px 15px rgba(0,0,0,0.05);border:1.5px solid #e2e8f0;">${d}</div>`).join("")}
        </div>
        <p style="color:#ef4444;font-weight:600;font-size:14px;">⏱ This code expires in 15 minutes</p>
      </div>

      <p style="color:#4a5568;font-size:15px;line-height:1.6;">If you didn't request this code, simply ignore this email.</p>

      <div style="background:#fffbea;border-left:4px solid #facc15;padding:15px 20px;border-radius:8px;margin-top:30px;font-size:14px;color:#78350f;">
        💡 <strong>Tip:</strong> Never share this code. Our team will never ask for it.
      </div>
    </div>

    <div style="text-align:center;padding:25px;font-size:13px;background:#f8fafc;color:#6b7280;border-top:1px solid #e5e7eb;">
      <p>© 2025 Muhammad Numan Akbar. All rights reserved.</p>
      <p>This email was sent to <strong>${email}</strong></p>
      <p>Block 5, Chichawatni, PB 57200</p>
      <p>Need help? <a href="#" style="color:#4F46E5;font-weight:600;text-decoration:none;">Contact Support</a></p>
    </div>
  </div>`;

  try {
    const { data, error } = await resend.emails.send({
      from: 'Muhammad Numan <no-reply@darulumeed.com>',
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
