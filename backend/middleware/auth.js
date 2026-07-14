const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

// Protect routes - verify token
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'ethara_secret_key');

      // Get user from the token, exclude password
      req.user = await Employee.findById(decoded.id).select('-password');
      
      if (!req.user) {
        return res.status(401).json({ message: 'Not authorized, user not found' });
      }
      
      if (req.user.status !== 'Active') {
        return res.status(401).json({ message: 'Not authorized, user account is inactive' });
      }

      next();
    } catch (error) {
      console.error('JWT Verification Error:', error.message);
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// Authorize system roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized' });
    }
    
    if (!roles.includes(req.user.system_role)) {
      return res.status(403).json({ 
        message: `User role '${req.user.system_role}' is not authorized to access this resource` 
      });
    }
    
    next();
  };
};

module.exports = { protect, authorize };
