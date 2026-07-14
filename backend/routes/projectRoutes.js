const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('Admin'), projectController.createProject);
router.get('/', protect, projectController.listProjects);
router.get('/:id/employees', protect, projectController.listProjectEmployees);

module.exports = router;
