const express = require('express');
const router = express.Router();
const seatController = require('../controllers/seatController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('Admin'), seatController.createSeat);
router.get('/', protect, seatController.listSeats);
router.get('/available', protect, seatController.listAvailableSeats);
router.post('/allocate', protect, authorize('Admin', 'HR'), seatController.allocateSeat);
router.post('/release', protect, authorize('Admin', 'HR'), seatController.releaseSeat);
router.put('/:id', protect, authorize('Admin'), seatController.updateSeat);

module.exports = router;
