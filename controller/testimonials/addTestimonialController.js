const Testimonial = require('../../models/testimonialsModel');

const addTestimonialController = async (req, res) => {
  try {
    const { message, rating } = req.body;

    // Use user info from token middleware
    const name = req.user?.name;
    const email = req.user?.email;
    const avatar = req.user?.avatar;

    // Validate input
    if (!message || !rating) {
      return res.status(400).json({
        message: "Message and rating are required.",
        success: false,
        error: true
      });
    }

    // Create testimonial with user data
    const newTestimonial = new Testimonial({
      name: name || "Anonymous",
      email: email || "",
      avatar: avatar || "",
      message,
      rating,
    });

    await newTestimonial.save();

    return res.status(201).json({
      message: "Testimonial submitted successfully!",
      success: true,
      error: false,
      testimonial: newTestimonial
    });

  } catch (err) {
    console.error("Submit Testimonial Error:", err);
    
    // Handle validation errors
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        message: `Validation Error: ${err.message}`,
        success: false,
        error: true
      });
    }
    
    return res.status(500).json({
      message: "Internal Server Error",
      success: false,
      error: true,
    });
  }
};

module.exports = addTestimonialController;