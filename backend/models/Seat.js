const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  floor: { type: Number, required: true },
  zone: { type: String, required: true },
  bay: { type: String, required: true },
  seat_number: { type: String, required: true },
  status: { type: String, enum: ['Available', 'Occupied', 'Reserved', 'Maintenance'], default: 'Available' },
}, { timestamps: true });

// Prevent duplicate seat numbers on the same floor, zone, and bay
seatSchema.index({ floor: 1, zone: 1, bay: 1, seat_number: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
