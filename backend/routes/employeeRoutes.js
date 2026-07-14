const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { protect, authorize } = require('../middleware/auth');

// Anyone logged in can view, but only Admin/HR can create, edit, or deactivate
router.post('/', protect, authorize('Admin', 'HR'), employeeController.createEmployee);
router.get('/', protect, employeeController.listEmployees);
router.get('/:id', protect, employeeController.getEmployeeById);
router.put('/:id', protect, authorize('Admin', 'HR'), employeeController.updateEmployee);
router.delete('/:id', protect, authorize('Admin', 'HR'), employeeController.deactivateEmployee);

module.exports = router;
