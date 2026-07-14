const Employee = require('../models/Employee');
const jwt = require('jsonwebtoken');

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'ethara_secret_key', {
    expiresIn: '30d'
  });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Find employee by email (case-insensitive)
    const employee = await Employee.findOne({ email: new RegExp(`^${email.trim()}$`, 'i') });
    
    if (!employee) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    if (employee.status !== 'Active') {
      return res.status(401).json({ message: 'This account has been deactivated' });
    }

    // Match password
    const isMatch = await employee.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    res.json({
      token: generateToken(employee._id),
      user: {
        _id: employee._id,
        employee_code: employee.employee_code,
        name: employee.name,
        email: employee.email,
        department: employee.department,
        role: employee.role,
        system_role: employee.system_role
      }
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/profile
// @access  Private
exports.getProfile = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user._id).select('-password').populate('project_id');
    if (!employee) {
      return res.status(404).json({ message: 'User profile not found' });
    }
    
    // Look up seat allocation
    const SeatAllocation = require('../models/SeatAllocation');
    const allocation = await SeatAllocation.findOne({ employee_id: employee._id, allocation_status: 'Active' }).populate('seat_id');

    res.json({
      ...employee.toObject(),
      seat: allocation ? allocation.seat_id : null,
      allocation: allocation || null
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
