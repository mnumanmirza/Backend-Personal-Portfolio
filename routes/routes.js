const express = require('express');
const router = express.Router();

// ✅ Multer for profilePic upload
const multer = require('multer');
const upload = multer(); // buffer-based memory storage

// ✅ Middleware
const authToken = require("../middleWare/authtoken");

// ✅ User Controllers
const {
  userSignUpController,
  sendOTPController,
  verifyOTPController
} = require("../controller/user/userSignUpController"); // ✅ correct path

const userSignInController = require("../controller/user/userSignin");
const userDetailsController = require("../controller/user/userDetails");
const userLogout = require("../controller/user/userLogout");

// ✅ Testimonial Controllers
const addTestimonialController = require("../controller/testimonials/addTestimonialController");
const getAllTestimonialsController = require("../controller/testimonials/getAllTestimonialsController");

// ✅ User Routes
router.post("/signup", upload.single("profilePic"), userSignUpController);
router.post("/signin", userSignInController);
router.get("/user-details", authToken, userDetailsController);
router.get("/userLogout", userLogout);

// ✅ OTP Routes
router.post("/send-otp", sendOTPController);
router.post("/verify-otp", verifyOTPController);

// ✅ Testimonial Routes
router.post("/addtestimonial", authToken, addTestimonialController);
router.get("/testimonials", getAllTestimonialsController);

module.exports = router;
