const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, dashboardController.getSummary);
router.get('/project-utilization', protect, dashboardController.getProjectUtilization);
router.get('/floor-utilization', protect, dashboardController.getFloorUtilization);

module.exports = router;
