const mongoose = require('mongoose');

const testimonialSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
  },
  email: {
    type: String,
    required: false,
  },
  avatar: {
    type: String,
    default: ""
  },
  message: {
    type: String,
    required: [true, 'Message is required'],
  },
  rating: {
    type: Number,
    required: [true, 'Rating is required'],
    min: [1, 'Rating must be at least 1'],
    max: [5, 'Rating cannot exceed 5']
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Testimonial', testimonialSchema);