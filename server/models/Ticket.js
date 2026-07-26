const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  attendeeName: { type: String, required: true },
  attendeeEmail: { type: String, required: true },
  ticketCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending_payment', 'valid', 'checked-in'], default: 'valid' },
  checkedInAt: { type: Date },
  razorpayOrderId: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
