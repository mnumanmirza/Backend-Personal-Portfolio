const Testimonial = require("../../models/testimonialsModel");

const deleteTestimonial = async (req, res) => {
  try {
    const testimonialId = req.params.id;
    await Testimonial.findByIdAndDelete(testimonialId);
    res.status(200).json({ success: true, message: "Testimonial deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete testimonial", error });
  }
};

module.exports = deleteTestimonial;
