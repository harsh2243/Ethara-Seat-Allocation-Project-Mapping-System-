const mongoose = require('mongoose');

const seatAllocationSchema = new mongoose.Schema({
  employee_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  seat_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  allocation_status: { type: String, enum: ['Active', 'Released'], default: 'Active' },
  allocation_date: { type: Date, default: Date.now },
  released_date: { type: Date }
}, { timestamps: true });

// Enforce database-level uniqueness for ACTIVE allocations only.
// This allows an employee/seat to have multiple past (Released) allocations,
// but at most one Active allocation.
seatAllocationSchema.index(
  { employee_id: 1 },
  { unique: true, partialFilterExpression: { allocation_status: 'Active' } }
);

seatAllocationSchema.index(
  { seat_id: 1 },
  { unique: true, partialFilterExpression: { allocation_status: 'Active' } }
);

module.exports = mongoose.model('SeatAllocation', seatAllocationSchema);
