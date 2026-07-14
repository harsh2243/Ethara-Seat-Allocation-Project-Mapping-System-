const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  employee_code: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  department: { type: String, required: true },
  role: { type: String, required: true }, // Job role, e.g. "Software Engineer"
  joining_date: { type: Date, required: true },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  
  // New Authentication Fields
  password: { type: String },
  system_role: { type: String, enum: ['Employee', 'HR', 'Admin'], default: 'Employee' }
}, { timestamps: true });

// Check password matching
employeeSchema.methods.matchPassword = async function (enteredPassword) {
  const bcrypt = require('bcryptjs');
  // If no password is set on the account, deny login
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// Hash password before saving
employeeSchema.pre('save', async function () {
  if (!this.password) {
    return;
  }
  if (!this.isModified('password')) {
    return;
  }
  // If already hashed, skip
  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) {
    return;
  }
  
  const bcrypt = require('bcryptjs');
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

module.exports = mongoose.model('Employee', employeeSchema);
