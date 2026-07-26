const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String, required: true },
  organizerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  maxAttendees: { type: Number },
  price: { type: Number, default: 0 },
  category: { 
    type: String, 
    enum: ['Technology', 'Music', 'Workshop', 'Business', 'Sports', 'Social', 'Other'],
    default: 'Other'
  }
}, { timestamps: true });

module.exports = mongoose.model('Event', eventSchema);
