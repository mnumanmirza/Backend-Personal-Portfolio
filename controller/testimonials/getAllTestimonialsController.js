const Testimonial = require("../../models/testimonialsModel");

const getAllTestimonialsController = async (req, res) => {
  try {
    const testimonials = await Testimonial.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, testimonials });  // 👈 success response
  } catch (error) {
    console.error("Error fetching testimonials:", error);
    res.status(500).json({ success: false, message: "Failed to get testimonials" });
  }
};

module.exports = getAllTestimonialsController;
